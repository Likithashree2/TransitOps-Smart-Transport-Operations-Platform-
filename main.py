from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
import re
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload
from app.config import get_settings
from app.database.session import SessionLocal
from app.models import Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, User, Setting
from app.models.enums import VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus
from app.models.status_history import VehicleStatusHistory, DriverStatusHistory, TripStatusHistory

app = FastAPI(title='TransitOps API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173','http://127.0.0.1:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
security=HTTPBearer(auto_error=False); pwd=CryptContext(schemes=['bcrypt'],deprecated='auto')
def db_session():
 db=SessionLocal()
 try: yield db
 finally: db.close()
def fail(code,msg): raise HTTPException(code,detail=msg)
def role(u): return u.role.name.value if u.role else ''
def user_of(c:HTTPAuthorizationCredentials=Depends(security),db:Session=Depends(db_session)):
 if not c: fail(401,'Authentication required')
 try: uid=int(jwt.decode(c.credentials,get_settings().jwt_secret_key,algorithms=[get_settings().jwt_algorithm])['sub'])
 except (JWTError,KeyError,ValueError): fail(401,'Invalid or expired token')
 u=db.query(User).options(joinedload(User.role)).get(uid)
 if not u or not u.is_active: fail(401,'User account is unavailable')
 return u
def permit(*roles):
 def check(u=Depends(user_of)):
  if role(u) not in roles: fail(403,'You do not have permission for this action')
  return u
 return check
def num(x): return float(x) if x is not None else None
def vo(x): return {'id':x.id,'registrationNo':x.registration_no,'nameModel':x.name_model,'type':x.vehicle_type.value,'maxLoadCapacityKg':num(x.max_load_capacity_kg),'odometerKm':num(x.odometer_km),'acquisitionCost':num(x.acquisition_cost),'status':x.status.value,'region':x.region or '', 'risk':'High' if num(x.odometer_km)>180000 else ('Medium' if num(x.odometer_km)>100000 else 'Low'),'riskScore':min(100,round(num(x.odometer_km)/2500)),'purchaseYear':x.purchase_date.year if x.purchase_date else None}
def do(x): return {'id':x.id,'fullName':x.full_name,'licenseNo':x.license_no,'licenseCategory':x.license_category,'licenseExpiry':x.license_expiry.isoformat(),'contactNumber':x.contact_number,'safetyScore':num(x.safety_score),'status':x.status.value}
def to(x): return {'id':x.id,'tripCode':x.trip_code,'source':x.source,'destination':x.destination,'vehicleId':x.vehicle_id,'driverId':x.driver_id,'cargoWeightKg':num(x.cargo_weight_kg),'plannedDistanceKm':num(x.planned_distance_km),'finalOdometerKm':num(x.final_odometer_km),'fuelConsumedL':num(x.fuel_consumed_l),'etaMinutes':x.estimated_eta_minutes,'revenue':num(x.revenue_amount) or 0,'status':x.status.value,'createdAt':x.created_at.isoformat(),'dispatchedAt':x.dispatched_at.isoformat() if x.dispatched_at else None,'completedAt':x.completed_at.isoformat() if x.completed_at else None,'cancelledAt':x.cancelled_at.isoformat() if x.cancelled_at else None}
def hist(db,kind,x,old,new,reason,u):
 args={'old_status':old,'new_status':new,'reason':reason,'changed_by':u.id}
 if kind=='trip': db.add(TripStatusHistory(trip_id=x.id,**args))
 elif kind=='vehicle': db.add(VehicleStatusHistory(vehicle_id=x.id,**args))
 else: db.add(DriverStatusHistory(driver_id=x.id,**args))
def body(d,k,default=None): return d.get(k,d.get(re.sub(r'([A-Z])',lambda m:'_'+m.group(1).lower(),k),default))

@app.get('/api/v1/health')
def health(): return {'status':'ok'}
@app.post('/api/v1/auth/login')
def login(data:dict,db:Session=Depends(db_session)):
 u=db.query(User).options(joinedload(User.role)).filter(func.lower(User.email)==str(data.get('email','')).lower()).first()
 if not u or not pwd.verify(data.get('password',''),u.password_hash):
  if u:
   u.failed_login_attempts+=1
   if u.failed_login_attempts>=get_settings().max_failed_login_attempts: u.account_locked=True;u.locked_until=datetime.now(timezone.utc)+timedelta(minutes=get_settings().account_lock_minutes)
   db.commit()
  fail(401,'Invalid credentials')
 if u.account_locked and u.locked_until and u.locked_until>datetime.now(timezone.utc): fail(403,'Account is temporarily locked')
 if data.get('role') and data['role']!=role(u): fail(403,'Selected role does not match this account')
 u.failed_login_attempts=0;u.account_locked=False;u.locked_until=None;db.commit()
 token=jwt.encode({'sub':str(u.id),'role':role(u),'exp':datetime.now(timezone.utc)+timedelta(minutes=get_settings().jwt_access_token_expire_minutes)},get_settings().jwt_secret_key,algorithm=get_settings().jwt_algorithm)
 return {'token':token,'user':{'id':u.id,'email':u.email,'fullName':u.full_name,'role':role(u),'isActive':u.is_active}}
@app.get('/api/v1/auth/me')
def me(u=Depends(user_of)): return {'id':u.id,'email':u.email,'fullName':u.full_name,'role':role(u),'isActive':u.is_active}

@app.get('/api/v1/vehicles')
def vehicles(search:str|None=None,status:str|None=None,vehicle_type:str|None=None,region:str|None=None,db:Session=Depends(db_session),u=Depends(user_of)):
 q=db.query(Vehicle)
 if search:q=q.filter(or_(Vehicle.registration_no.ilike(f'%{search}%'),Vehicle.name_model.ilike(f'%{search}%')))
 if status:q=q.filter(Vehicle.status==status)
 if vehicle_type:q=q.filter(Vehicle.vehicle_type==vehicle_type)
 if region:q=q.filter(Vehicle.region==region)
 return [vo(x) for x in q.order_by(Vehicle.id.desc()).all()]
@app.post('/api/v1/vehicles',status_code=201)
def create_vehicle(data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager'))):
 reg=body(data,'registrationNo'); cap=float(body(data,'maxLoadCapacityKg',0));odo=float(body(data,'odometerKm',0));cost=float(body(data,'acquisitionCost',0))
 if db.query(Vehicle).filter_by(registration_no=reg).first():fail(409,'Registration number already exists')
 if cap<=0 or odo<0 or cost<0:fail(400,'Vehicle capacity, odometer and cost are invalid')
 x=Vehicle(registration_no=reg,name_model=body(data,'nameModel'),vehicle_type=body(data,'type'),max_load_capacity_kg=cap,odometer_km=odo,acquisition_cost=cost,region=data.get('region'),status=data.get('status','Available'));db.add(x);db.commit();db.refresh(x);return vo(x)
@app.patch('/api/v1/vehicles/{id}')
def update_vehicle(id:int,data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager'))):
 x=db.get(Vehicle,id)
 if not x:fail(404,'Vehicle not found')
 for a,b in [('registrationNo','registration_no'),('nameModel','name_model'),('type','vehicle_type'),('maxLoadCapacityKg','max_load_capacity_kg'),('odometerKm','odometer_km'),('acquisitionCost','acquisition_cost'),('region','region'),('status','status')]:
  if a in data:setattr(x,b,data[a])
 db.commit();db.refresh(x);return vo(x)

@app.get('/api/v1/drivers')
def drivers(db:Session=Depends(db_session),u=Depends(user_of)):return [do(x) for x in db.query(Driver).order_by(Driver.id.desc()).all()]
@app.post('/api/v1/drivers',status_code=201)
def create_driver(data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager','safety_officer'))):
 lic=body(data,'licenseNo')
 if db.query(Driver).filter_by(license_no=lic).first():fail(409,'License number already exists')
 x=Driver(full_name=body(data,'fullName'),license_no=lic,license_category=body(data,'licenseCategory'),license_expiry=date.fromisoformat(body(data,'licenseExpiry')),contact_number=body(data,'contactNumber'),safety_score=float(body(data,'safetyScore',100)),status=data.get('status','Available'));db.add(x);db.commit();db.refresh(x);return do(x)
@app.patch('/api/v1/drivers/{id}')
def update_driver(id:int,data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager','safety_officer'))):
 x=db.get(Driver,id)
 if not x:fail(404,'Driver not found')
 for a,b in [('fullName','full_name'),('licenseNo','license_no'),('licenseCategory','license_category'),('licenseExpiry','license_expiry'),('contactNumber','contact_number'),('safetyScore','safety_score'),('status','status')]:
  if a in data:setattr(x,b,date.fromisoformat(data[a]) if a=='licenseExpiry' else data[a])
 db.commit();db.refresh(x);return do(x)

@app.get('/api/v1/trips')
def trips(db:Session=Depends(db_session),u=Depends(user_of)):return [to(x) for x in db.query(Trip).order_by(Trip.id.desc()).all()]
@app.post('/api/v1/trips',status_code=201)
def create_trip(data:dict,db:Session=Depends(db_session),u=Depends(permit('dispatcher','fleet_manager'))):
 code=f'TR{db.query(Trip).count()+1:03d}';x=Trip(trip_code=code,source=data['source'],destination=data['destination'],vehicle_id=body(data,'vehicleId'),driver_id=body(data,'driverId'),cargo_weight_kg=float(body(data,'cargoWeightKg')),planned_distance_km=float(body(data,'plannedDistanceKm')),estimated_eta_minutes=body(data,'etaMinutes'),status=TripStatus.DRAFT,created_by=u.id);db.add(x);db.flush();hist(db,'trip',x,None,'Draft','Trip created',u);db.commit();db.refresh(x);return to(x)
@app.post('/api/v1/trips/{id}/dispatch')
def dispatch(id:int,db:Session=Depends(db_session),u=Depends(permit('dispatcher','fleet_manager'))):
 t=db.query(Trip).filter_by(id=id).with_for_update().first()
 if not t:fail(404,'Trip not found')
 if t.status!=TripStatus.DRAFT:fail(409,'Only Draft trips can be dispatched')
 if not t.vehicle_id or not t.driver_id:fail(400,'A vehicle and driver are required before dispatch')
 v=db.query(Vehicle).filter_by(id=t.vehicle_id).with_for_update().first();d=db.query(Driver).filter_by(id=t.driver_id).with_for_update().first()
 if not v or not d:fail(400,'Assigned vehicle or driver not found')
 if v.status!=VehicleStatus.AVAILABLE:fail(409,f'Vehicle is currently {v.status.value} and cannot be dispatched.')
 if d.status!=DriverStatus.AVAILABLE:fail(409,f'Driver is currently {d.status.value} and cannot be dispatched.')
 if d.license_expiry<date.today():fail(400,f'Driver license expired on {d.license_expiry.isoformat()}.')
 if db.query(Trip).filter(Trip.status==TripStatus.DISPATCHED,or_(Trip.vehicle_id==v.id,Trip.driver_id==d.id)).first():fail(409,'Vehicle or driver is already assigned to an active trip.')
 if t.cargo_weight_kg>v.max_load_capacity_kg:
  over=num(t.cargo_weight_kg-v.max_load_capacity_kg);fail(400,f'Cargo weight {num(t.cargo_weight_kg):g}kg exceeds vehicle capacity {num(v.max_load_capacity_kg):g}kg. Capacity exceeded by {over:g}kg - dispatch blocked.')
 t.status=TripStatus.DISPATCHED;t.dispatched_at=datetime.now(timezone.utc);v.status=VehicleStatus.ON_TRIP;d.status=DriverStatus.ON_TRIP;hist(db,'trip',t,'Draft','Dispatched','Trip dispatched',u);hist(db,'vehicle',v,'Available','On Trip','Trip dispatched',u);hist(db,'driver',d,'Available','On Trip','Trip dispatched',u);db.commit();db.refresh(t);return to(t)
@app.post('/api/v1/trips/{id}/complete')
def complete(id:int,data:dict={},db:Session=Depends(db_session),u=Depends(permit('dispatcher','fleet_manager'))):
 t=db.get(Trip,id)
 if not t or t.status!=TripStatus.DISPATCHED:fail(409,'Only Dispatched trips can be completed')
 v=db.get(Vehicle,t.vehicle_id);d=db.get(Driver,t.driver_id);final=body(data,'finalOdometerKm');fuel=body(data,'fuelConsumedL')
 if final is not None and float(final)<num(v.odometer_km):fail(400,'Final odometer cannot be lower than current vehicle odometer')
 t.status=TripStatus.COMPLETED;t.completed_at=datetime.now(timezone.utc);t.final_odometer_km=final;t.fuel_consumed_l=fuel;t.revenue_amount=t.revenue_amount or t.planned_distance_km*45
 if final is not None:v.odometer_km=final
 v.status=VehicleStatus.AVAILABLE;d.status=DriverStatus.AVAILABLE;hist(db,'trip',t,'Dispatched','Completed','Trip completed',u);hist(db,'vehicle',v,'On Trip','Available','Trip completed',u);hist(db,'driver',d,'On Trip','Available','Trip completed',u);db.commit();db.refresh(t);return to(t)
@app.post('/api/v1/trips/{id}/cancel')
def cancel(id:int,db:Session=Depends(db_session),u=Depends(permit('dispatcher','fleet_manager'))):
 t=db.get(Trip,id)
 if not t or t.status not in [TripStatus.DRAFT,TripStatus.DISPATCHED]:fail(409,'Only Draft or Dispatched trips can be cancelled')
 old=t.status.value;t.status=TripStatus.CANCELLED;t.cancelled_at=datetime.now(timezone.utc);hist(db,'trip',t,old,'Cancelled','Trip cancelled',u)
 if old=='Dispatched':
  v=db.get(Vehicle,t.vehicle_id);d=db.get(Driver,t.driver_id);v.status=VehicleStatus.AVAILABLE;d.status=DriverStatus.AVAILABLE;hist(db,'vehicle',v,'On Trip','Available','Trip cancelled',u);hist(db,'driver',d,'On Trip','Available','Trip cancelled',u)
 db.commit();db.refresh(t);return to(t)

@app.get('/api/v1/maintenance')
def maintenance(db:Session=Depends(db_session),u=Depends(user_of)):return [{'id':x.id,'vehicleId':x.vehicle_id,'serviceType':x.service_type,'cost':num(x.cost),'serviceDate':x.service_date.isoformat(),'status':x.status.value,'notes':x.notes,'riskScore':0} for x in db.query(MaintenanceLog).order_by(MaintenanceLog.id.desc()).all()]
@app.post('/api/v1/maintenance',status_code=201)
def open_maintenance(data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager'))):
 v=db.get(Vehicle,body(data,'vehicleId'))
 if not v:fail(404,'Vehicle not found')
 if v.status==VehicleStatus.ON_TRIP:fail(409,'Cannot start maintenance for a vehicle On Trip')
 if db.query(MaintenanceLog).filter_by(vehicle_id=v.id,status=MaintenanceStatus.ACTIVE).first():fail(409,'Vehicle already has active maintenance')
 x=MaintenanceLog(vehicle_id=v.id,service_type=body(data,'serviceType'),cost=data['cost'],service_date=date.fromisoformat(body(data,'serviceDate')),notes=data.get('notes'),status=MaintenanceStatus.ACTIVE);db.add(x);old=v.status.value
 if old!='Retired':v.status=VehicleStatus.IN_SHOP;hist(db,'vehicle',v,old,'In Shop','Maintenance opened',u)
 db.commit();db.refresh(x);return {'id':x.id,'vehicleId':x.vehicle_id,'serviceType':x.service_type,'cost':num(x.cost),'serviceDate':x.service_date.isoformat(),'status':x.status.value,'notes':x.notes,'riskScore':0}
@app.post('/api/v1/maintenance/{id}/close')
def close_maintenance(id:int,db:Session=Depends(db_session),u=Depends(permit('fleet_manager'))):
 x=db.get(MaintenanceLog,id)
 if not x or x.status!=MaintenanceStatus.ACTIVE:fail(409,'Active maintenance record not found')
 x.status=MaintenanceStatus.COMPLETED;v=db.get(Vehicle,x.vehicle_id)
 if v.status!=VehicleStatus.RETIRED:v.status=VehicleStatus.AVAILABLE;hist(db,'vehicle',v,'In Shop','Available','Maintenance closed',u)
 db.commit();return {'id':x.id,'status':'Completed'}

def fuelout(x):return {'id':x.id,'vehicleId':x.vehicle_id,'tripId':x.trip_id,'liters':num(x.liters),'cost':num(x.cost),'logDate':x.log_date.isoformat()}
@app.get('/api/v1/fuel-logs')
@app.get('/api/v1/fuel')
def fuels(db:Session=Depends(db_session),u=Depends(user_of)):return [fuelout(x) for x in db.query(FuelLog).order_by(FuelLog.id.desc()).all()]
@app.post('/api/v1/fuel-logs',status_code=201)
@app.post('/api/v1/fuel',status_code=201)
def add_fuel(data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager','financial_analyst'))):
 if float(data['liters'])<=0 or float(data['cost'])<0:fail(400,'Liters must be positive and cost cannot be negative')
 x=FuelLog(vehicle_id=body(data,'vehicleId'),trip_id=body(data,'tripId'),liters=data['liters'],cost=data['cost'],log_date=date.fromisoformat(body(data,'logDate')),odometer_km=body(data,'odometerKm'));db.add(x);db.commit();db.refresh(x);return fuelout(x)
@app.get('/api/v1/expenses')
def expenses(db:Session=Depends(db_session),u=Depends(user_of)):return [{'id':x.id,'vehicleId':x.vehicle_id,'tripId':x.trip_id,'category':x.category.value,'amount':num(x.amount),'expenseDate':x.expense_date.isoformat(),'note':x.description} for x in db.query(Expense).order_by(Expense.id.desc()).all()]
@app.post('/api/v1/expenses',status_code=201)
def add_expense(data:dict,db:Session=Depends(db_session),u=Depends(permit('fleet_manager','financial_analyst'))):
 if float(data['amount'])<0:fail(400,'Expense amount cannot be negative')
 x=Expense(vehicle_id=body(data,'vehicleId'),trip_id=body(data,'tripId'),category=data['category'],amount=data['amount'],expense_date=date.fromisoformat(body(data,'expenseDate')),description=data.get('note'));db.add(x);db.commit();db.refresh(x);return {'id':x.id,'vehicleId':x.vehicle_id,'tripId':x.trip_id,'category':x.category.value,'amount':num(x.amount),'expenseDate':x.expense_date.isoformat(),'note':x.description}

def dashboard_data(db):
 counts={s.value:n for s,n in db.query(Vehicle.status,func.count(Vehicle.id)).group_by(Vehicle.status).all()};active=sum(counts.values())-counts.get('Retired',0)
 return {'activeVehicles':active,'availableVehicles':counts.get('Available',0),'inMaintenanceVehicles':counts.get('In Shop',0),'activeTrips':db.query(Trip).filter_by(status=TripStatus.DISPATCHED).count(),'pendingTrips':db.query(Trip).filter_by(status=TripStatus.DRAFT).count(),'driversOnDuty':db.query(Driver).filter_by(status=DriverStatus.ON_TRIP).count(),'fleetUtilization':round(counts.get('On Trip',0)/active*100,1) if active else 0,'vehicleStatus':[{'status':k,'count':v} for k,v in counts.items()]}
@app.get('/api/v1/dashboard')
@app.get('/api/v1/analytics/dashboard')
def dashboard(db:Session=Depends(db_session),u=Depends(user_of)):return dashboard_data(db)
@app.get('/api/v1/analytics')
@app.get('/api/v1/analytics/fleet-report')
def analytics(db:Session=Depends(db_session),u=Depends(user_of)):
 trips=db.query(Trip).filter_by(status=TripStatus.COMPLETED).all();fuels=db.query(FuelLog).all();maint=db.query(MaintenanceLog).all();exps=db.query(Expense).all();vs=db.query(Vehicle).all();cost={v.id:0 for v in vs};rev={v.id:0 for v in vs}
 for x in fuels:cost[x.vehicle_id]=cost.get(x.vehicle_id,0)+num(x.cost)
 for x in maint:cost[x.vehicle_id]=cost.get(x.vehicle_id,0)+num(x.cost)
 for x in exps:cost[x.vehicle_id]=cost.get(x.vehicle_id,0)+num(x.amount)
 for x in trips:
  if x.vehicle_id:rev[x.vehicle_id]=rev.get(x.vehicle_id,0)+(num(x.revenue_amount) or 0)
 dist=sum(num(x.planned_distance_km) for x in trips);used=sum(num(x.fuel_consumed_l) or 0 for x in trips);monthly={}
 for x in trips:monthly[x.completed_at.strftime('%b')]=monthly.get(x.completed_at.strftime('%b'),0)+(num(x.revenue_amount) or 0)
 return {'fuelEfficiencyKmPerL':round(dist/used,2) if used else 0,'operationalCost':sum(cost.values()),'monthlyRevenue':[{'month':k,'revenue':v} for k,v in monthly.items()],'topCostliestVehicles':[{'vehicle':vo(v),'cost':cost.get(v.id,0)} for v in sorted(vs,key=lambda x:cost.get(x.id,0),reverse=True)[:5]],'vehicleRoi':[{'vehicle':vo(v),'revenue':rev.get(v.id,0),'cost':cost.get(v.id,0),'roiPct':round((rev.get(v.id,0)-cost.get(v.id,0))/num(v.acquisition_cost)*100,1) if num(v.acquisition_cost) else 0} for v in vs],'dashboard':dashboard_data(db)}
@app.get('/api/v1/analytics/vehicle-roi')
def roi(db:Session=Depends(db_session),u=Depends(user_of)):return analytics(db,u)['vehicleRoi']
@app.get('/api/v1/insights')
def insights(db:Session=Depends(db_session),u=Depends(user_of)):
 return [{'type':'license_alert','driverId':d.id,'severity':'High' if (d.license_expiry-date.today()).days<0 else 'Medium','message':f'{d.full_name} license {"expired" if (d.license_expiry-date.today()).days<0 else "expires in "+str((d.license_expiry-date.today()).days)+" days"}'} for d in db.query(Driver).all() if (d.license_expiry-date.today()).days<=30]
@app.post('/api/v1/ai/copilot/dispatch')
def copilot(data:dict,db:Session=Depends(db_session),u=Depends(permit('dispatcher','fleet_manager'))):
 m=re.search(r'(\d+)\s*kg',data.get('prompt',''),re.I);v=db.query(Vehicle).filter_by(status=VehicleStatus.AVAILABLE).first();d=db.query(Driver).filter(Driver.status==DriverStatus.AVAILABLE,Driver.license_expiry>=date.today()).first()
 if not v or not d:fail(409,'No dispatchable vehicle and driver are available')
 return {'source':'Gandhinagar Depot','destination':'Ahmedabad Hub','cargoWeightKg':float(m.group(1)) if m else 100,'plannedDistanceKm':40,'vehicleId':v.id,'driverId':d.id,'explanation':'Rule-aware template proposal. Review it, then dispatch through the normal validation flow.'}

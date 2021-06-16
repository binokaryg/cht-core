import sinon from 'sinon';
import { expect } from 'chai';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { CHTScriptApiService } from '@mm-services/cht-script-api.service';
import { UserSettingsService } from '@mm-services/user-settings.service';
import { SettingsService } from '@mm-services/settings.service';
import { ChangesService } from '@mm-services/changes.service';

describe('CHTScriptApiService service', () => {
  let service: CHTScriptApiService;
  let userSettingsService;
  let settingsService;
  let changesService;

  beforeEach(() => {
    userSettingsService = { getUserDocId: sinon.stub(), get: sinon.stub() };
    settingsService = { get: sinon.stub() };
    changesService = { subscribe: sinon.stub() };

    TestBed.configureTestingModule({
      providers: [
        { provide: UserSettingsService, useValue: userSettingsService },
        { provide: SettingsService, useValue: settingsService },
        { provide: ChangesService, useValue: changesService}
      ]
    });

    service = TestBed.inject(CHTScriptApiService);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should unsubscribe from observables when ngOnDestroy() is called', () => {
    const unsubscribeSpy = sinon.spy(service.subscriptions, 'unsubscribe');

    service.ngOnDestroy();

    expect(unsubscribeSpy.callCount).to.equal(1);
  });

  it('should initialise service', async () => {
    const addSubscriptionSpy = sinon.spy(service.subscriptions, 'add');
    settingsService.get.resolves();
    userSettingsService.get.resolves();

    await service.init();

    expect(changesService.subscribe.callCount).to.equal(2);
    expect(changesService.subscribe.args[0][0].key).to.equal('cht-script-api-user-settings-changes');
    expect(changesService.subscribe.args[0][0].filter).to.be.a('function');
    expect(changesService.subscribe.args[0][0].callback).to.be.a('function');
    expect(changesService.subscribe.args[1][0].key).to.equal('cht-script-api-settings-changes');
    expect(changesService.subscribe.args[1][0].filter).to.be.a('function');
    expect(changesService.subscribe.args[1][0].callback).to.be.a('function');
    expect(addSubscriptionSpy.callCount).to.equal(2);
    expect(settingsService.get.callCount).to.equal(1);
    expect(userSettingsService.get.callCount).to.equal(1);
  });

  it('should return versioned api', () => {
    const result = service.getApi();

    expect(result).to.have.all.keys([ 'v1' ]);
    expect(result.v1).to.have.all.keys([ 'hasPermissions', 'hasAnyPermission' ]);
    expect(result.v1.hasPermissions).to.be.a('function');
    expect(result.v1.hasAnyPermission).to.be.a('function');
  });

  describe('v1.hasPermissions()', () => {
    it('should return true when user have the permission', fakeAsync(() => {
      settingsService.get.resolves({
        permissions: {
          can_edit: [ 'chw_supervisor' ],
          can_configure: [ 'nurse' ]
        }
      });
      userSettingsService.get.resolves({ roles: [ 'chw_supervisor', 'gateway' ] });
      service.init();
      tick();
      const api = service.getApi();

      const result = api.v1.hasPermissions('can_edit');

      expect(result).to.be.true;
    }));

    it('should return false when user doesnt have the permission', fakeAsync(() => {
      settingsService.get.resolves({
        permissions: {
          can_edit: [ 'chw_supervisor' ],
          can_configure: [ 'nurse' ]
        }
      });
      userSettingsService.get.resolves({ roles: [ 'chw_supervisor', 'gateway' ] });
      service.init();
      tick();
      const api = service.getApi();

      const result = api.v1.hasPermissions('can_create_people');

      expect(result).to.be.false;
    }));

    it('should react to changes and return false when user is undefined or doesnt have roles', fakeAsync(() => {
      settingsService.get.resolves({
        permissions: {
          can_edit: [ 'chw_supervisor' ],
          can_configure: [ 'nurse' ]
        }
      });
      userSettingsService.get.resolves();
      service.init();
      const changesCallback = changesService.subscribe.args[1][0].callback;
      tick();
      const api = service.getApi();

      const resultUserUndefined = api.v1.hasPermissions('can_create_people');

      userSettingsService.get.resolves({ roles: null });
      sinon.resetHistory();
      changesCallback();
      tick();

      const resultNoRoles = api.v1.hasPermissions('can_create_people');

      expect(resultUserUndefined).to.be.false;
      expect(resultNoRoles).to.be.false;
      expect(userSettingsService.get.callCount).to.equal(0);
      expect(settingsService.get.callCount).to.equal(1);
    }));

    it('should return true when user is admin', fakeAsync(() => {
      settingsService.get.resolves({
        permissions: {
          can_edit: [ 'chw_supervisor' ],
          can_configure: [ 'nurse' ]
        }
      });
      userSettingsService.get.resolves({ roles: [ '_admin' ] });
      service.init();
      tick();
      const api = service.getApi();

      const result = api.v1.hasPermissions('can_create_people');

      expect(result).to.be.true;
    }));

    it('should return false when settings doesnt have roles assigned for the permission', fakeAsync(() => {
      settingsService.get.resolves({
        permissions: {
          can_edit: [ 'chw_supervisor' ],
          can_configure: null
        }
      });
      userSettingsService.get.resolves({ roles: [ 'chw_supervisor' ] });
      service.init();
      tick();
      const api = service.getApi();

      const result = api.v1.hasPermissions('can_configure');

      expect(result).to.be.false;
    }));
  });
});
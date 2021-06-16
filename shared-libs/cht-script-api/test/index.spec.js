
const expect = require('chai').expect;
const chtScriptApi = require('../src/index');

describe('CHT Script API - index', () => {
  it('should contain all functions', () => {
    expect(chtScriptApi).to.have.all.keys([ 'setChtCoreSettingsDoc', 'setUserSettingsDoc', 'getApi' ]);
    expect(chtScriptApi.setChtCoreSettingsDoc).to.be.a('function');
    expect(chtScriptApi.setUserSettingsDoc).to.be.a('function');
    expect(chtScriptApi.getApi).to.be.a('function');
  });

  it('should return versioned api and set functions', () => {
    const result = chtScriptApi.getApi();

    expect(result).to.have.all.keys([ 'v1' ]);
    expect(result.v1).to.have.all.keys([ 'hasPermissions', 'hasAnyPermission' ]);
    expect(result.v1.hasPermissions).to.be.a('function');
    expect(result.v1.hasAnyPermission).to.be.a('function');
  });

  it('should call auth.hasPermission and react to cache changes', () => {
    chtScriptApi.setChtCoreSettingsDoc({
      permissions: {
        can_edit: [ 'chw_supervisor' ],
        can_configure: [ 'nurse' ]
      }
    });
    chtScriptApi.setUserSettingsDoc(undefined);
    const api = chtScriptApi.getApi();

    const resultUserUndefined = api.v1.hasPermissions('can_create_people');

    chtScriptApi.setUserSettingsDoc({ roles: [ 'nurse' ] });
    chtScriptApi.setChtCoreSettingsDoc({
      permissions: {
        can_edit: [ 'chw_supervisor' ],
        can_create_people: [ 'nurse' ]
      }
    });

    const resultHasPermission = api.v1.hasPermissions('can_create_people');

    expect(resultUserUndefined).to.be.false;
    expect(resultHasPermission).to.be.true;
  });

  it('should call auth.hasPermission and pass documents by parameter', () => {
    const api = chtScriptApi.getApi();
    const userSettingsDoc = { roles: [ 'chw' ] };
    const chtSettingsDoc = {
      permissions: {
        can_backup_facilities: [ 'chw', 'national_admin' ],
        can_export_messages: [ 'national_admin', 'chw', 'analytics' ]
      }
    };

    const result = api.v1.hasPermissions(
      ['can_backup_facilities', 'can_export_messages'],
      userSettingsDoc,
      chtSettingsDoc
    );

    expect(result).to.be.true;
  });
});
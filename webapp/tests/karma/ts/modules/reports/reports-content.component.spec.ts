import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';
import { ActivatedRoute, Router } from '@angular/router';

import { ChangesService } from '@mm-services/changes.service';
import { ReportsContentComponent } from '@mm-modules/reports/reports-content.component';
import { SettingsService } from '@mm-services/settings.service';
import { Selectors } from '@mm-selectors/index';
import { SearchFiltersService } from '@mm-services/search-filters.service';
import { ReportsActions } from '@mm-actions/reports';
import { GlobalActions } from '@mm-actions/global';
import { MessageStateService } from '@mm-services/message-state.service';
import { ModalService } from '@mm-services/modal.service';
import { EditMessageGroupComponent } from '@mm-modals/edit-message-group/edit-message-group.component';
import { ResponsiveService } from '@mm-services/responsive.service';
import { FormIconPipe } from '@mm-pipes/form-icon.pipe';
import { ResourceIconPipe } from '@mm-pipes/resource-icon.pipe';
import { TitlePipe } from '@mm-pipes/message.pipe';
import { RelativeDatePipe } from '@mm-pipes/date.pipe';
import { FastActionButtonService } from '@mm-services/fast-action-button.service';
import { DbService } from '@mm-services/db.service';
import { SendMessageComponent } from '@mm-modals/send-message/send-message.component';
import { FastActionButtonComponent } from '@mm-components/fast-action-button/fast-action-button.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '@mm-services/auth.service';
import { SessionService } from '@mm-services/session.service';
import { SearchTelemetryService } from '@mm-services/search-telemetry.service';
import { SenderComponent } from '@mm-components/sender/sender.component';
import { ReportVerifyInvalidIconComponent } from '@mm-components/status-icons/status-icons.template';

describe('Reports Content Component', () => {
  let component: ReportsContentComponent;
  let fixture: ComponentFixture<ReportsContentComponent>;
  let store: MockStore;
  let changesService;
  let searchFiltersService;
  let activatedRoute;
  let messageStateService;
  let router;
  let responsiveService;
  let fastActionButtonService;
  let medicDb;
  let dbService;
  let modalService;
  let authService;
  let sessionService;
  let searchTelemetryService;

  beforeEach(waitForAsync(() => {
    const mockedSelectors = [
      { selector: Selectors.getSelectedReportDoc, value: undefined },
      { selector: Selectors.getSelectedReports, value: [] },
      { selector: Selectors.getForms, value: [] },
      { selector: Selectors.getLoadingContent, value: false },
      { selector: Selectors.getSelectMode, value: false },
    ];
    searchFiltersService = { freetextSearch: sinon.stub() };
    changesService = { subscribe: sinon.stub().returns({ unsubscribe: sinon.stub() }) };
    activatedRoute = { params: { subscribe: sinon.stub() }, snapshot: { params: {} } };
    router = {
      navigate: sinon.stub(),
      events: { pipe: sinon.stub().returns({ subscribe: sinon.stub() }) },
    };
    messageStateService = { any: sinon.stub(), set: sinon.stub().resolves() };
    responsiveService = { isMobile: sinon.stub() };
    fastActionButtonService = { getReportRightSideActions: sinon.stub() };
    medicDb = { get: sinon.stub().resolves() };
    dbService = { get: sinon.stub().returns(medicDb) };
    modalService = { show: sinon.stub() };
    authService = {
      isAdmin: sinon.stub(),
      has: sinon.stub()
    };
    sessionService = { isAdmin: sinon.stub() };
    searchTelemetryService = { recordReportSearch: sinon.stub() };

    return TestBed
      .configureTestingModule({
        imports: [
          TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
          RouterTestingModule,
          CommonModule,
          ReportsContentComponent,
          EditMessageGroupComponent,
          FormIconPipe,
          TitlePipe,
          RelativeDatePipe,
          FastActionButtonComponent,
          SenderComponent,
          ReportVerifyInvalidIconComponent
        ],
        providers: [
          provideMockStore({ selectors: mockedSelectors }),
          { provide: ChangesService, useValue: changesService },
          { provide: SearchFiltersService, useValue: searchFiltersService },
          { provide: SettingsService, useValue: {} }, // Needed because of ngx-translate provider's constructor.
          { provide: ActivatedRoute, useValue: activatedRoute },
          { provide: Router, useValue: router },
          { provide: MessageStateService, useValue: messageStateService },
          { provide: ResponsiveService, useValue: responsiveService },
          { provide: ModalService, useValue: modalService },
          { provide: ResourceIconPipe, useValue: { transform: sinon.stub() } },
          { provide: FastActionButtonService, useValue: fastActionButtonService },
          { provide: DbService, useValue: dbService },
          { provide: AuthService, useValue: authService },
          { provide: SessionService, useValue: sessionService },
          { provide: SearchTelemetryService, useValue: searchTelemetryService },
          { provide: MatBottomSheet, useValue: { open: sinon.stub() } },
          { provide: MatDialog, useValue: { open: sinon.stub() } },
        ]
      })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(ReportsContentComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        fixture.detectChanges();
      });
  }));

  afterEach(() => {
    store.resetSelectors();
    sinon.restore();
  });

  it('should create ReportsContentComponent', () => {
    expect(component).to.exist;
  });

  it('ngOnInit() should watch for changes and watch for route changes', () => {
    changesService.subscribe.resetHistory();
    activatedRoute.params.subscribe.resetHistory();

    const spySubscriptionsAdd = sinon.spy(component.subscription, 'add');

    component.ngOnInit();

    expect(changesService.subscribe.callCount).to.equal(1);
    expect(activatedRoute.params.subscribe.callCount).to.equal(1);
    expect(spySubscriptionsAdd.callCount).to.equal(5);
  });

  describe('Route subscription', () => {
    it('should react correctly when route has id param', () => {
      const callback = activatedRoute.params.subscribe.args[0][0];
      const selectReportToOpenStub = sinon.stub(ReportsActions.prototype, 'selectReportToOpen');
      const clearNavigationStub = sinon.stub(GlobalActions.prototype, 'clearNavigation');
      const unsetComponentsStub = sinon.stub(GlobalActions.prototype, 'unsetComponents');
      activatedRoute.snapshot.params = { id: 'someID' };

      callback({ id: 'id' });

      expect(selectReportToOpenStub.calledOnce).to.be.true;
      expect(selectReportToOpenStub.args[0]).to.deep.equal([ 'someID' ]);
      expect(clearNavigationStub.calledOnce).to.be.true;
      expect(unsetComponentsStub.notCalled).to.be.true;
    });

    it('should react correctly when route does not have id param', () => {
      const callback = activatedRoute.params.subscribe.args[0][0];
      const selectReportToOpenStub = sinon.stub(ReportsActions.prototype, 'selectReportToOpen');
      const clearNavigationStub = sinon.stub(GlobalActions.prototype, 'clearNavigation');
      const unsetComponentsStub = sinon.stub(GlobalActions.prototype, 'unsetComponents');
      activatedRoute.snapshot.params = { id: 'someID' };

      callback({ });

      expect(selectReportToOpenStub.notCalled).to.be.true;
      expect(clearNavigationStub.notCalled).to.be.true;
      expect(unsetComponentsStub.calledOnce).to.be.true;
    });
  });

  describe('Changes subscription', () => {
    it('filter function should return true for selected reports', () => {
      const filter = changesService.subscribe.args[0][0].filter;
      store.overrideSelector(Selectors.getSelectedReports, [{ _id: 'report1', doc: {} }, { _id: 'report2', doc: {} }]);
      store.refreshState();
      fixture.detectChanges();
      expect(filter({ id: 'report1' })).to.equal(true);
      expect(filter({ id: 'report2' })).to.equal(true);
    });

    it('filter function should return false for selected reports', () => {
      const filter = changesService.subscribe.args[0][0].filter;
      store.overrideSelector(Selectors.getSelectedReports, [{ _id: 'report1', doc: {} }, { _id: 'report2', doc: {} }]);
      store.refreshState();
      fixture.detectChanges();
      expect(filter({ id: 'report3' })).to.equal(false);
      expect(filter({ id: 'report4' })).to.equal(false);
    });

    it('callback should handle deletions when not in select mode ', () => {
      const callback = changesService.subscribe.args[0][0].callback;
      activatedRoute.snapshot = { parent: { routeConfig: { path: 'reports' } } };
      fixture.detectChanges();
      callback({ deleted: true });
      expect(router.navigate.callCount).to.equal(1);
      expect(router.navigate.args[0]).to.deep.equal([['reports']]);
    });

    it('callback should handle deletions when in select mode', () => {
      const callback = changesService.subscribe.args[0][0].callback;
      store.overrideSelector(Selectors.getSelectMode, true);
      store.refreshState();
      fixture.detectChanges();
      const removeSelectedReport = sinon.stub(ReportsActions.prototype, 'removeSelectedReport');
      callback({ deleted: true, id: 'reportID' });
      expect(removeSelectedReport.callCount).to.equal(1);
      expect(removeSelectedReport.args[0]).to.deep.equal(['reportID']);
    });

    it('callback should handle report updates when not routing to any report', () => {
      const callback = changesService.subscribe.args[0][0].callback;
      const selectReportToOpenStub = sinon.stub(ReportsActions.prototype, 'selectReportToOpen');

      callback({ id: 'reportID' });

      expect(selectReportToOpenStub.calledOnce).to.be.true;
      expect(selectReportToOpenStub.args[0]).to.deep.equal([ 'reportID', { silent: true } ]);
    });

    it('callback should handle report updates when routing to updated report', () => {
      activatedRoute.snapshot.params = { id: 'reportID' };
      const callback = changesService.subscribe.args[0][0].callback;
      const selectReportToOpenStub = sinon.stub(ReportsActions.prototype, 'selectReportToOpen');

      callback({ id: 'reportID' });

      expect(selectReportToOpenStub.calledOnce).to.be.true;
      expect(selectReportToOpenStub.args[0]).to.deep.equal([ 'reportID', { silent: true } ]);
    });

    it('callback should ignore report updates when routing to different report', () => {
      activatedRoute.snapshot.params = { id: 'differentReportID' };
      const callback = changesService.subscribe.args[0][0].callback;
      const selectReportToOpenStub = sinon.stub(ReportsActions.prototype, 'selectReportToOpen');

      callback({ id: 'reportID' });

      expect(selectReportToOpenStub.notCalled).to.be.true;
    });
  });

  it('trackbyfn should return unique value', () => {
    const report = { doc: { _id: 'a', _rev: 'b' } };
    expect(component.trackByFn(0, report)).to.equal('ab');
  });

  describe('toggleExpand', () => {
    let updateSelectedReportsItem;
    let selectReport;

    beforeEach(() => {
      updateSelectedReportsItem = sinon.stub(ReportsActions.prototype, 'updateSelectedReportsItem');
      selectReport = sinon.stub(ReportsActions.prototype, 'selectReport');
    });

    it('should do nothing when not in select mode', () => {
      component.selectMode = false;
      component.toggleExpand({ _id: 'thing' });
      expect(updateSelectedReportsItem.callCount).to.equal(0);
      expect(selectReport.callCount).to.equal(0);
    });

    it('should do nothing when in select mode but no report', () => {
      component.selectMode = true;
      component.toggleExpand(undefined);
      expect(updateSelectedReportsItem.callCount).to.equal(0);
      expect(selectReport.callCount).to.equal(0);
    });

    it('should toggle expanded and load', () => {
      component.selectMode = true;
      const report = { _id: 'report_id' };
      component.toggleExpand(report);
      expect(updateSelectedReportsItem.callCount).to.equal(1);
      expect(updateSelectedReportsItem.args[0]).to.deep.equal(['report_id', { loading: true, expanded: true }]);
      expect(selectReport.callCount).to.equal(1);
      expect(selectReport.args[0]).to.deep.equal([ 'report_id' ]);
    });

    it('should only toggle expanded when report already loaded', () => {
      component.selectMode = true;
      const report = { _id: 'report_id', doc: { _id: 'report_id', value: '1' } };
      component.toggleExpand(report);
      expect(updateSelectedReportsItem.callCount).to.equal(1);
      expect(updateSelectedReportsItem.args[0]).to.deep.equal(['report_id', { expanded: true }]);
      expect(selectReport.callCount).to.equal(0);
    });

    it('should only toggle expanded when report already expanded', () => {
      component.selectMode = true;
      const report = { _id: 'report_id', expanded: true };
      component.toggleExpand(report);
      expect(updateSelectedReportsItem.callCount).to.equal(1);
      expect(updateSelectedReportsItem.args[0]).to.deep.equal(['report_id', { expanded: false }]);
      expect(selectReport.callCount).to.equal(0);
    });
  });

  describe('deselect', () => {
    let removeSelectedReportStub;
    let event;

    beforeEach(() => {
      removeSelectedReportStub = sinon.stub(ReportsActions.prototype, 'removeSelectedReport');
      event = { stopPropagation: sinon.stub() };
    });

    it('should do nothing when not in select mode', () => {
      component.selectMode = false;
      const report = { _id: 'report' };

      component.deselect(report, event);

      expect(removeSelectedReportStub.notCalled).to.be.true;
    });

    it('should call removeSelectedReport when in select mode', () => {
      component.selectMode = true;
      const report = { _id: 'report' };

      component.deselect(report, event);

      expect(removeSelectedReportStub.calledOnce).to.be.true;
      expect(removeSelectedReportStub.args[0]).to.deep.equal([ report ]);
    });
  });

  describe('edit', () => {
    it('should open modal', async () => {
      const report = { _id: 'report '};
      const group = { rows: [{ id: 'task' }] };

      await component.edit(report, group);
      expect(modalService.show.callCount).to.equal(1);
      expect(modalService.show.args[0]).to.deep.equal([
        EditMessageGroupComponent,
        { data: { report, group } },
      ]);
      expect(modalService.show.args[0][1].data.group).to.not.equal(group);
    });
  });

  describe('schedule', () => {
    it('should set message state to scheduled', async () => {
      const report = { _id: 'doc_id' };
      const group = { rows: [{ group: 1, message: 2 }, { group: 1, message: 3 }] };
      const locals:any = {};

      const promise = component.schedule(report, group, locals);

      expect(locals.loading).to.equal(true);
      expect(messageStateService.set.callCount).to.equal(1);
      expect(messageStateService.set.args[0]).to.deep.equal([ 'doc_id', 1, 'muted', 'scheduled' ]);
      await promise;
    });

    it('should not crash on incorrect input', async () => {
      await component.schedule(false, false, {});
    });

    it('should reset loading on crash', async () => {
      const consoleErrorMock = sinon.stub(console, 'error');
      const report = { _id: 'doc_id' };
      const group = { rows: [{ group: 1, message: 2 }, { group: 1, message: 3 }] };
      const locals:any = {};
      messageStateService.set.rejects();

      const promise = component.schedule(report, group, locals);

      expect(locals.loading).to.equal(true);
      expect(messageStateService.set.callCount).to.equal(1);
      expect(messageStateService.set.args[0]).to.deep.equal([ 'doc_id', 1, 'muted', 'scheduled' ]);
      await promise;
      expect(locals.loading).to.equal(false);
      expect(consoleErrorMock.callCount).to.equal(1);
      expect(consoleErrorMock.args[0][0]).to.equal('Error setting message state');
    });
  });

  describe('mute', () => {
    it('should set message state to scheduled', async () => {
      const report = { _id: 'report_id' };
      const group = { rows: [{ group: 33, message: 2 }, { group: 33, message: 3 }] };
      const locals:any = {};

      const promise = component.mute(report, group, locals);

      expect(locals.loading).to.equal(true);
      expect(messageStateService.set.callCount).to.equal(1);
      expect(messageStateService.set.args[0]).to.deep.equal([ 'report_id', 33, 'scheduled', 'muted' ]);
      await promise;
    });

    it('should not crash on incorrect input', async () => {
      await component.mute(false, false, {});
    });
  });

  describe('canMute', () => {
    it('should return value from service', () => {
      messageStateService.any.returns('lalalal');
      const group = { the: 'group' };
      expect(component.canMute(group)).to.equal('lalalal');
      expect(messageStateService.any.callCount).to.equal(1);
      expect(messageStateService.any.args[0]).to.deep.equal([group, 'scheduled']);
    });
  });

  describe('canSchedule', () => {
    it('should return value from service', () => {
      messageStateService.any.returns('canScheduleisTrue');
      const group = { the: 'other group' };
      expect(component.canSchedule(group)).to.equal('canScheduleisTrue');
      expect(messageStateService.any.callCount).to.equal(1);
      expect(messageStateService.any.args[0]).to.deep.equal([group, 'muted']);
    });
  });

  describe('updateFastActions()', () => {
    it('should update fast actions when report is selected', fakeAsync(() => {
      const contact = { _id: 'person-1' };
      const contactWithPhone = { _id: 'person-1', phone: '+621345678902' };
      medicDb.get.resolves(contactWithPhone);
      store.overrideSelector(Selectors.getSelectedReportDoc, { content_type: 'xml', contact });
      store.refreshState();
      fixture.detectChanges();

      flush();

      expect(fastActionButtonService.getReportRightSideActions.calledOnce).to.be.true;
      const params = fastActionButtonService.getReportRightSideActions.args[0][0];
      expect(params.reportContentType).to.equal('xml');
      expect(params.communicationContext.sendTo).to.deep.equal(contactWithPhone);

      params.communicationContext.callbackOpenSendMessage(contactWithPhone);
      expect(modalService.show.calledOnce).to.be.true;
      expect(modalService.show.args[0]).to.have.deep.members([
        SendMessageComponent,
        { data: { to: contactWithPhone } },
      ]);
    }));

    it('should not update fast actions', fakeAsync(() => {
      store.overrideSelector(Selectors.getSelectMode, true);
      store.refreshState();
      fixture.detectChanges();

      expect(component.selectMode).to.be.true;

      store.overrideSelector(Selectors.getSelectedReportDoc, { content_type: 'xml', contact: {} });
      store.refreshState();
      fixture.detectChanges();

      flush();

      expect(fastActionButtonService.getReportRightSideActions.notCalled).to.be.true;

      store.overrideSelector(Selectors.getSelectedReportDoc, undefined);
      store.refreshState();
      fixture.detectChanges();

      flush();

      expect(fastActionButtonService.getReportRightSideActions.notCalled).to.be.true;
    }));
  });

  describe('search', () => {
    it('should not search when select mode is true', fakeAsync(() => {
      store.overrideSelector(Selectors.getSelectMode, true);
      store.refreshState();
      fixture.detectChanges();

      component.search('case_id:abc-1234');

      expect(component.selectMode).to.be.true;
      expect(searchFiltersService.freetextSearch.notCalled).to.be.true;
    }));

    it('should search if select mode is false', fakeAsync(() => {
      store.overrideSelector(Selectors.getSelectMode, false);
      store.refreshState();
      fixture.detectChanges();

      component.search('case_id:abc-1234');

      expect(component.selectMode).to.be.false;
      expect(searchFiltersService.freetextSearch.calledOnce).to.be.true;
    }));

    it('should collect telemetry for the selected search results', fakeAsync(() => {
      store.overrideSelector(Selectors.getSelectMode, true);
      store.refreshState();
      fixture.detectChanges();

      // search for a report
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(0);
      const search = 'case_id:abc-1234';
      store.overrideSelector(Selectors.getFilters, { search });
      store.refreshState();
      fixture.detectChanges();
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(0);

      // select a report, collect telemetry
      const report = { _id: 'report_id', doc: { case_id: 'abc-1234' } };
      store.overrideSelector(Selectors.getSelectedReport, report);
      store.refreshState();
      fixture.detectChanges();
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(1);
      expect(searchTelemetryService.recordReportSearch.getCall(0).args).to.deep.equal([report.doc, search]);

      // re-select same report, don't re-collect telemetry
      store.overrideSelector(Selectors.getSelectedReport, report);
      store.refreshState();
      fixture.detectChanges();
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(1);

      // select a different report, collect telemetry
      const otherReport = { _id: 'other_report_id', doc: { other_case_id: 'abc-1234' } };
      store.overrideSelector(Selectors.getSelectedReport, otherReport);
      store.refreshState();
      fixture.detectChanges();
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(2);
      expect(searchTelemetryService.recordReportSearch.getCall(1).args).to.deep.equal([otherReport.doc, search]);

      // un-select report and select all reports, don't collect telemetry
      store.overrideSelector(Selectors.getSelectedReport, undefined);
      store.refreshState();
      fixture.detectChanges();
      store.overrideSelector(Selectors.getSelectedReports, [report, otherReport]);
      store.refreshState();
      fixture.detectChanges();
      expect(searchTelemetryService.recordReportSearch.callCount).to.equal(2);
    }));
  });
});

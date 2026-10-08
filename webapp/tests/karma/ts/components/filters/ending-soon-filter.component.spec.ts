import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { expect } from 'chai';
import sinon from 'sinon';

import { EndingSoonFilterComponent } from '@mm-components/filters/ending-soon-filter/ending-soon-filter.component';
import { GlobalActions } from '@mm-actions/global';

describe('EndingSoonFilterComponent', () => {
  let component: EndingSoonFilterComponent;
  let fixture: ComponentFixture<EndingSoonFilterComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        EndingSoonFilterComponent,
      ],
      providers: [
        provideMockStore(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EndingSoonFilterComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    store.resetSelectors();
    sinon.restore();
  });

  it('should create', () => {
    expect(component).to.exist;
  });

  it('should offer 5 and 7 day options', () => {
    expect(component.dayOptions).to.deep.equal([5, 7]);
  });

  it('should render one radio per option', () => {
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radios.length).to.equal(2);
    expect(radios[0].value).to.equal('5');
    expect(radios[1].value).to.equal('7');
  });

  it('should apply filter when 5 days is selected', () => {
    const setFilterStub = sinon.stub(GlobalActions.prototype, 'setFilter');
    const searchEmitSpy = sinon.spy(component.search, 'emit');

    component.applyFilter([5]);

    expect(setFilterStub.calledOnce).to.be.true;
    expect(setFilterStub.args[0][0]).to.deep.equal({ taskEndingSoonDays: 5 });
    expect(searchEmitSpy.calledOnce).to.be.true;
  });

  it('should apply filter when 7 days is selected', () => {
    const setFilterStub = sinon.stub(GlobalActions.prototype, 'setFilter');
    const searchEmitSpy = sinon.spy(component.search, 'emit');

    component.applyFilter([7]);

    expect(setFilterStub.calledOnce).to.be.true;
    expect(setFilterStub.args[0][0]).to.deep.equal({ taskEndingSoonDays: 7 });
    expect(searchEmitSpy.calledOnce).to.be.true;
  });

  it('should apply undefined filter when none are selected', () => {
    const setFilterStub = sinon.stub(GlobalActions.prototype, 'setFilter');

    component.applyFilter([]);

    expect(setFilterStub.calledOnce).to.be.true;
    expect(setFilterStub.args[0][0]).to.deep.equal({ taskEndingSoonDays: undefined });
  });

  it('should apply undefined filter when more than one is selected', () => {
    const setFilterStub = sinon.stub(GlobalActions.prototype, 'setFilter');

    component.applyFilter([5, 7]);

    expect(setFilterStub.calledOnce).to.be.true;
    expect(setFilterStub.args[0][0]).to.deep.equal({ taskEndingSoonDays: undefined });
  });

  it('should toggle a single selection and replace a previous one', () => {
    const setFilterStub = sinon.stub(GlobalActions.prototype, 'setFilter');

    component.toggle(5);
    expect(Array.from(component.filter.selected)).to.deep.equal([5]);
    expect(setFilterStub.lastCall.args[0]).to.deep.equal({ taskEndingSoonDays: 5 });

    component.toggle(7);
    expect(Array.from(component.filter.selected)).to.deep.equal([7]);
    expect(setFilterStub.lastCall.args[0]).to.deep.equal({ taskEndingSoonDays: 7 });

    component.toggle(7);
    expect(component.filter.selected.size).to.equal(0);
    expect(setFilterStub.lastCall.args[0]).to.deep.equal({ taskEndingSoonDays: undefined });
  });

  it('should clear filter', () => {
    const clearSpy = sinon.spy(component.filter, 'clear');

    component.clear();

    expect(clearSpy.calledOnce).to.be.true;
  });

  it('should not clear filter when disabled', () => {
    component.disabled = true;
    const clearSpy = sinon.spy(component.filter, 'clear');

    component.clear();

    expect(clearSpy.called).to.be.false;
  });

  it('should count selected', () => {
    expect(component.countSelected()).to.equal(0);

    component.filter.selected.add(5);
    expect(component.countSelected()).to.equal(1);
  });
});

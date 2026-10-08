import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Store } from '@ngrx/store';

import { GlobalActions } from '@mm-actions/global';
import { Filter } from '@mm-components/filters/filter';
import { NgFor } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'mm-ending-soon-filter',
  templateUrl: './ending-soon-filter.component.html',
  imports: [NgFor, TranslatePipe]
})
export class EndingSoonFilterComponent {
  @Input() disabled;
  @Input() fieldId;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() search: EventEmitter<any> = new EventEmitter();

  private readonly globalActions: GlobalActions;
  filter: Filter;

  // Number of calendar days until the task's last visible day (endDate), inclusive of today.
  dayOptions = [5, 7];

  constructor(private readonly store: Store) {
    this.globalActions = new GlobalActions(store);
    this.filter = new Filter(this.applyFilter.bind(this));
  }

  applyFilter(selected) {
    const taskEndingSoonDays = selected.length === 1 ? selected[0] : undefined;

    this.globalActions.setFilter({ taskEndingSoonDays });
    this.search.emit();
  }

  clear() {
    if (this.disabled) {
      return;
    }
    this.filter.clear();
  }

  toggle(days: number) {
    if (this.filter.selected.has(days)) {
      this.filter.clear();
    } else {
      this.filter.clear();
      this.filter.selected.add(days);
      this.filter.apply();
    }
  }

  countSelected() {
    return this.filter?.countSelected();
  }
}

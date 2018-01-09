import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MytardisComponent } from './mytardis.component';

describe('MytardisComponent', () => {
  let component: MytardisComponent;
  let fixture: ComponentFixture<MytardisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MytardisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MytardisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadlinkComponent } from './uploadlink.component';

describe('UploadlinkComponent', () => {
  let component: UploadlinkComponent;
  let fixture: ComponentFixture<UploadlinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadlinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadlinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewArrivals } from './new-arrivals';

describe('NewArrivals', () => {
  let component: NewArrivals;
  let fixture: ComponentFixture<NewArrivals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewArrivals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewArrivals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

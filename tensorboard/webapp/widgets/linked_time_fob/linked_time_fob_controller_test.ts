/* Copyright 2022 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Component, Input, NO_ERRORS_SCHEMA, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {LinkedTimeFobComponent} from './linked_time_fob_component';
import {
  Fob,
  LinkedTimeFobControllerComponent,
} from './linked_time_fob_controller_component';
import {AxisDirection, FobCardAdapter, LinkedTime} from './linked_time_types';

@Component({
  selector: 'testable-comp',
  template: `
    <linked-time-fob-controller
      #FobController
      [axisDirection]="axisDirection"
      [linkedTime]="linkedTime"
      [cardAdapter]="fobCardAdapter"
      [showExtendedLine]="showExtendedLine"
      (onSelectTimeChanged)="onSelectTimeChanged($event)"
      (onSelectTimeToggle)="onSelectTimeToggle()"
    ></linked-time-fob-controller>
  `,
})
class TestableComponent {
  @ViewChild('FobController')
  fobController!: LinkedTimeFobControllerComponent;

  @Input() axisDirection!: AxisDirection;
  @Input() linkedTime!: LinkedTime;
  @Input() fobCardAdapter!: FobCardAdapter;
  @Input() showExtendedLine?: Boolean;

  @Input() onSelectTimeChanged!: (newLinkedTime: LinkedTime) => void;
  @Input() onSelectTimeToggle!: () => void;
}

describe('linked_time_fob_controller', () => {
  let onSelectTimeChanged: jasmine.Spy;
  let onSelectTimeToggle: jasmine.Spy;
  let getHighestStepSpy: jasmine.Spy;
  let getLowestStepSpy: jasmine.Spy;
  let getAxisPositionFromStepSpy: jasmine.Spy;
  let getStepHigherSpy: jasmine.Spy;
  let getStepLowerSpy: jasmine.Spy;
  let fobCardAdapter: FobCardAdapter;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TestableComponent,
        LinkedTimeFobComponent,
        LinkedTimeFobControllerComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  function createComponent(input: {
    axisDirection?: AxisDirection;
    linkedTime: LinkedTime;
    showExtendedLine?: Boolean;
    steps?: number[];
  }): ComponentFixture<TestableComponent> {
    const fixture = TestBed.createComponent(TestableComponent);

    // Absolutely place the fixture at the top left of the page to keep
    // position calculations in the test easier.
    fixture.debugElement.nativeElement.style.position = 'absolute';
    fixture.debugElement.nativeElement.style.left = '0';
    fixture.debugElement.nativeElement.style.top = '0';

    getHighestStepSpy = jasmine.createSpy();
    getLowestStepSpy = jasmine.createSpy();
    getAxisPositionFromStepSpy = jasmine.createSpy();
    getStepHigherSpy = jasmine.createSpy();
    getStepLowerSpy = jasmine.createSpy();
    fobCardAdapter = {
      getHighestStep: getHighestStepSpy,
      getLowestStep: getLowestStepSpy,
      getAxisPositionFromStep: getAxisPositionFromStepSpy,
      getStepHigherThanAxisPosition: getStepHigherSpy,
      getStepLowerThanAxisPosition: getStepLowerSpy,
    };

    getHighestStepSpy.and.callFake(() => 4);
    getLowestStepSpy.and.callFake(() => 0);
    getAxisPositionFromStepSpy.and.callFake((step: number) => {
      return step;
    });
    getStepHigherSpy.and.callFake((step: number) => {
      return step;
    });
    getStepLowerSpy.and.callFake((step: number) => {
      return step;
    });
    fixture.componentInstance.fobCardAdapter = fobCardAdapter;

    fixture.componentInstance.axisDirection =
      input.axisDirection ?? AxisDirection.VERTICAL;

    fixture.componentInstance.linkedTime = input.linkedTime;

    fixture.componentInstance.showExtendedLine =
      input.showExtendedLine ?? false;

    onSelectTimeChanged = jasmine.createSpy();
    fixture.componentInstance.onSelectTimeChanged = onSelectTimeChanged;

    onSelectTimeToggle = jasmine.createSpy();
    fixture.componentInstance.onSelectTimeToggle = onSelectTimeToggle;

    return fixture;
  }

  it('sets fob position based on linked time and getAxisPositionFromStep call', () => {
    const fixture = createComponent({
      linkedTime: {start: {step: 2}, end: null},
    });
    fixture.detectChanges();
    expect(getAxisPositionFromStepSpy).toHaveBeenCalledOnceWith(2);
  });

  describe('vertical dragging', () => {
    it('moves the start fob based on adapter getStepHigherThanMousePosition when mouse is dragging down and is below fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(1);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientY: 3, movementY: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepHigherSpy).toHaveBeenCalledOnceWith(3);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 3},
        end: null,
      });
    });

    it('moves the start fob based on adapter getStepLowerThanMousePosition when mouse is dragging up and above the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {
        clientY: 2,
        movementY: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledOnceWith(2);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 2},
        end: null,
      });
    });
    it('does not call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging up but, is below the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 2}, end: null},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {
        clientY: 4,
        movementY: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('does not call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging down but, is above the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientY: 2, movementY: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('does not move the start fob or call call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging down but, the fob is already on the final step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
      });
      getHighestStepSpy.and.callFake(() => 4);
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientY: 8, movementY: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('end fob moves to the mouse when mouse is dragging up and mouse is above the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 1}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(1);
      fobController.startDrag(Fob.END);
      onSelectTimeChanged.calls.reset();
      const fakeEvent = new MouseEvent('mousemove', {clientY: 3, movementY: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepHigherSpy).toHaveBeenCalledOnceWith(3);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 3},
      });
    });
    it('end fob moves to the mouse when mouse is dragging down and mouse is below the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 4}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(4);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {
        clientY: 2,
        movementY: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledOnceWith(2);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 2},
      });
    });
    it('end fob does not move when mouse is dragging down but, mouse is above the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 2}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {
        clientY: 3,
        movementY: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('end fob does not move when mouse is dragging up but, mouse is below the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(3);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {clientY: 2, movementY: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().top
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
  });

  describe('horizontal dragging', () => {
    it('moves the start fob based on adapter getStepHigherThanMousePosition when mouse is dragging right and is to the right of fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(1);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientX: 3, movementX: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepHigherSpy).toHaveBeenCalledOnceWith(3);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 3},
        end: null,
      });
    });

    it('moves the start fob based on adapter getStepLowerThanMousePosition when mouse is dragging left and is left of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {
        clientX: 2,
        movementX: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledOnceWith(2);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 2},
        end: null,
      });
    });
    it('does not call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging left but, is right of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 2}, end: null},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {
        clientX: 4,
        movementX: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('does not call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging right but, is left of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientX: 2, movementX: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('does not move the start fob or call call getStepLowerThanMousePosition or getStepHigherThanMousePosition when mouse is dragging right but, the fob is already on the final step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 4}, end: null},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      getHighestStepSpy.and.callFake(() => 4);
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      fobController.startDrag(Fob.START);
      const fakeEvent = new MouseEvent('mousemove', {clientX: 8, movementX: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.startFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('end fob moves to the mouse when mouse is dragging left and mouse is left of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 1}},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(1);
      fobController.startDrag(Fob.END);
      onSelectTimeChanged.calls.reset();
      const fakeEvent = new MouseEvent('mousemove', {clientX: 3, movementX: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepHigherSpy).toHaveBeenCalledOnceWith(3);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 3},
      });
    });
    it('end fob moves to the mouse when mouse is dragging right and mouse is right of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 4}},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(4);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {
        clientX: 2,
        movementX: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledOnceWith(2);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 2},
      });
    });
    it('end fob does not move when mouse is dragging right but, mouse is left of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 2}},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {
        clientX: 3,
        movementX: -1,
      });
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(2);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
    it('end fob does not move when mouse is dragging left but, mouse is right of the fob', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
        axisDirection: AxisDirection.HORIZONTAL,
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(3);
      fobController.startDrag(Fob.END);
      const fakeEvent = new MouseEvent('mousemove', {clientX: 2, movementX: 1});
      fobController.mouseMove(fakeEvent);
      fixture.detectChanges();
      expect(getStepLowerSpy).toHaveBeenCalledTimes(0);
      expect(getStepHigherSpy).toHaveBeenCalledTimes(0);
      expect(
        fobController.endFobWrapper.nativeElement.getBoundingClientRect().left
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledTimes(0);
    });
  });

  describe('extended line', () => {
    it('renders single line on setting showExtendedLine true', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
        showExtendedLine: true,
      });
      fixture.detectChanges();

      const extendedLine = fixture.debugElement.query(By.css('.extended-line'));
      expect(extendedLine).toBeTruthy();
    });

    it('renders two lines on range selection', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 4}},
        showExtendedLine: true,
      });
      fixture.detectChanges();

      const extendedLines = fixture.debugElement.queryAll(
        By.css('.extended-line')
      );
      expect(extendedLines.length).toBe(2);
    });

    it('clicks and drags the line to change selected step in horizontal axis', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
        axisDirection: AxisDirection.HORIZONTAL,
        showExtendedLine: true,
      });
      fixture.detectChanges();

      const fobController = fixture.componentInstance.fobController;
      const extendedLines = fixture.debugElement.queryAll(
        By.css('.extended-line')
      );
      const startFobExtendedLine = extendedLines[0];
      const endFobExtendedLine = extendedLines[1];
      expect(
        startFobExtendedLine.nativeElement.getBoundingClientRect().left
      ).toEqual(1);
      expect(
        endFobExtendedLine.nativeElement.getBoundingClientRect().left
      ).toEqual(3);

      // Clicks and drags extended line from start fob
      startFobExtendedLine.nativeElement.dispatchEvent(
        new MouseEvent('mousedown', {bubbles: true})
      );
      fobController.mouseMove(
        new MouseEvent('mousemove', {clientX: 3, movementX: 1})
      );
      fixture.detectChanges();

      expect(getStepHigherSpy).toHaveBeenCalledWith(3);
      expect(
        startFobExtendedLine.nativeElement.getBoundingClientRect().left
      ).toEqual(3);
      expect(onSelectTimeChanged).toHaveBeenCalledWith({
        start: {step: 3},
        end: {step: 3},
      });

      // Clicks and drags extended line from end fob
      startFobExtendedLine.nativeElement.dispatchEvent(
        new MouseEvent('mouseup', {bubbles: true})
      );
      endFobExtendedLine.nativeElement.dispatchEvent(
        new MouseEvent('mousedown', {bubbles: true})
      );
      fobController.mouseMove(
        new MouseEvent('mousemove', {clientX: 5, movementX: 1})
      );
      fixture.detectChanges();

      expect(getStepHigherSpy).toHaveBeenCalledWith(5);
      expect(
        endFobExtendedLine.nativeElement.getBoundingClientRect().left
      ).toEqual(5);
      expect(onSelectTimeChanged).toHaveBeenCalledWith({
        start: {step: 3},
        end: {step: 5},
      });
    });
  });

  describe('typing step into fob', () => {
    it('single time selection changed with fob typing', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.START, 3);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 3},
        end: null,
      });
    });

    it('range selection start fob step typed which is less than end fob step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 4}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.START, 3);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 3},
        end: {step: 4},
      });
    });

    it('range selection end fob step typed which is greater than start fob step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 4}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.END, 3);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 3},
      });
    });

    it('range selection swaps when start step is typed in which is greater than end step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 2}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.START, 3);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 2},
        end: {step: 3},
      });
    });

    it('range selection swaps when end step is typed in which is less than start step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 3}, end: {step: 4}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.END, 2);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 2},
        end: {step: 3},
      });
    });

    it('properly handles a 0 step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 3}, end: {step: 4}},
      });
      fixture.detectChanges();
      const fobController = fixture.componentInstance.fobController;
      fobController.stepTyped(Fob.END, 0);
      fixture.detectChanges();
      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 0},
        end: {step: 3},
      });
    });

    it('changing start input modifies start step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
      });
      fixture.detectChanges();

      const stepSpan = fixture.debugElement.query(
        By.css('linked-time-fob.startFob span')
      );
      stepSpan.nativeElement.innerText = '8';
      stepSpan.triggerEventHandler('keydown.enter', {
        target: stepSpan.nativeElement,
        preventDefault: () => {},
      });

      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 8},
        end: null,
      });
    });

    it('changing end fob input modifies end step', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
      });
      fixture.detectChanges();

      const stepSpan = fixture.debugElement.query(
        By.css('linked-time-fob.endFob span')
      );
      stepSpan.nativeElement.innerText = '8';
      const preventDefaultSpy = jasmine.createSpy();
      stepSpan.triggerEventHandler('keydown.enter', {
        target: stepSpan.nativeElement,
        preventDefault: preventDefaultSpy,
      });

      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: {step: 8},
      });
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('deselecting fob', () => {
    it('fires onSelectTimeToggle when in single selection', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: null},
      });
      fixture.detectChanges();

      const deselectButton = fixture.debugElement.query(
        By.css('linked-time-fob.startFob button')
      );
      deselectButton.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(onSelectTimeToggle).toHaveBeenCalledOnceWith();
    });

    it('fires onSelectTimeChanged to remove end fob when end fob is deselected', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
      });
      fixture.detectChanges();

      const deselectButton = fixture.debugElement.query(
        By.css('linked-time-fob.endFob button')
      );
      deselectButton.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 1},
        end: null,
      });
    });

    it('fires onSelectTimeChanged to change the start fob step to the current end fob step and the end fob step to null when start fob is deselected in a range selection', () => {
      const fixture = createComponent({
        linkedTime: {start: {step: 1}, end: {step: 3}},
      });
      fixture.detectChanges();

      const deselectButton = fixture.debugElement.query(
        By.css('linked-time-fob.startFob button')
      );
      deselectButton.triggerEventHandler('click', {});
      fixture.detectChanges();

      expect(onSelectTimeChanged).toHaveBeenCalledOnceWith({
        start: {step: 3},
        end: null,
      });
    });
  });
});

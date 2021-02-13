/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "common/samples-common.scss";
import { EmphasizeElements, FeatureOverrideType, IModelApp, IModelConnection, ScreenViewport, ViewChangeOptions } from "@bentley/imodeljs-frontend";
import { ColorDef } from "@bentley/imodeljs-common";
import IotAlertUI from "./IotAlertUI";
import SampleApp from "common/SampleApp";

export default class IotAlertApp implements SampleApp {
  private static elementNameIdMap: Map<string, string> = new Map();
  private static blinkingElementSet = new Set<string>();
  private static selectedElements: string[] = [];

  public static getElementNameIdMap() {
    return IotAlertApp.elementNameIdMap;
  }

  public static setElementNameIdMap(elementNameIdMap: any) {
    for (const [key, value] of elementNameIdMap) {
      IotAlertApp.elementNameIdMap.set(key, value);
    }
  }

  public static getBlinkingElementSet() {
    return this.blinkingElementSet;
  }

  public static setBlinkingElementSet(selectedElement: string) {
    if (selectedElement === undefined) {
      return;
    }
    IotAlertApp.blinkingElementSet.add(selectedElement);
  }

  public static clearBlinkingElementSet() {
    IotAlertApp.blinkingElementSet.clear();
  }

  public static getSelectedElements() {
    return this.selectedElements;
  }

  public static setSelectedElements(selectedElement: string) {
    if (selectedElement === undefined) {
      return;
    }
    IotAlertApp.selectedElements.push(selectedElement);
  }

  public static clearSelectedElements() {
    IotAlertApp.selectedElements = [];
  }

  public static getElements() {
    return this.elementMap;
  }

  public static setBlinkingElements(elements: string[]) {
    IotAlertApp.blinkingElementSet.clear();
    for (const t of elements) {
      IotAlertApp.setBlinkingElementSet(t);
    }
  }

  private static elementMap: string[];

  public static zoomToElements = async (id: string) => {
    const viewChangeOpts: ViewChangeOptions = {};
    viewChangeOpts.animateFrustumChange = true;
    const vp = IModelApp.viewManager.selectedView!;
    const ids = new Set<string>();
    const m = IotAlertApp.getElementNameIdMap();
    for (const [key, value] of m) {
      if (key === id) {
        ids.add(value);
      }
    }
    await vp.zoomToElements(ids, { ...viewChangeOpts });
  }

  public static fetchElementsFromClass = (className: string, elementsMap: Map<string, []>) => {
    const classElements: any = elementsMap.get(className);
    const elementNames: any = [];
    const elementNameIdMap = new Map();
    if (classElements === undefined) {
      return elementNames;
    }
    for (const element of classElements) {
      elementNames.push(element.cOMPONENT_NAME);
      elementNameIdMap.set(element.cOMPONENT_NAME, element.id);
    }
    IotAlertApp.setElementNameIdMap(elementNameIdMap);
    return elementNames;
  }

  public static async fetchElements(imodel: IModelConnection, c: string) {
    const elementMapQuery = `SELECT * FROM ProcessPhysical.${c}`;
    IotAlertApp.elementMap = await this._executeQuery(imodel, elementMapQuery);
  }

  public static async setup(iModelName: string, iModelSelector: React.ReactNode) {
    return <IotAlertUI iModelName={iModelName} iModelSelector={iModelSelector} elementsMap={IotAlertApp.elementMap} />;
  }

  public static teardown() {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp)
      return;

    const emph = EmphasizeElements.getOrCreate(vp);
    emph.clearEmphasizedElements(vp);
    emph.clearHiddenElements(vp);
    emph.clearIsolatedElements(vp);
    emph.clearOverriddenElements(vp);
  }

  private static _executeQuery = async (imodel: IModelConnection, query: string) => {
    const rows = [];
    for await (const row of imodel.query(query))
      rows.push(row);
    return rows;
  }
}

abstract class EmphasizeActionBase {
  protected abstract execute(emph: EmphasizeElements, vp: ScreenViewport): boolean;

  public run(): boolean {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp) {
      return false;
    }

    if (vp) {
      // Select some elements
      const ids = new Set<string>();
      const m = IotAlertApp.getElementNameIdMap();
      // console.log(`EmphasizeActionBase m: ${m}`);
      for (const [key, value] of m) {
        const selectedElements = IotAlertApp.getBlinkingElementSet();
        // console.log(`EmphasizeActionBase selectedElement: ${selectedElement}`);
        for (const element of selectedElements) {
          if (key === element) {
            ids.add(value);
            // console.log(`EmphasizeActionBase inside if: ${value}`);
          }
        }
      }
      // ids.add("0x40000000329");//metro station
      // ids.add("0x20000001381");//CoffsHarborDemo
      vp.view.iModel.selectionSet.replace(ids);
    }

    const emph = EmphasizeElements.getOrCreate(vp);
    return this.execute(emph, vp);
  }
}

export class EmphasizeAction extends EmphasizeActionBase {
  private _wantEmphasis: boolean;

  public constructor(wantEmphasis: boolean) {
    super();
    this._wantEmphasis = wantEmphasis;
  }
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.wantEmphasis = this._wantEmphasis;
    emph.emphasizeSelectedElements(vp);
    return true;
  }
}

export class ClearEmphasizeAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearEmphasizedElements(vp);
    return true;
  }
}

export class HideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.hideSelectedElements(vp);
    return true;
  }
}

export class ClearHideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearHiddenElements(vp);
    return true;
  }
}

export class IsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.isolateSelectedElements(vp);
    return true;
  }
}

export class ClearIsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearIsolatedElements(vp);
    return true;
  }
}

export class OverrideAction extends EmphasizeActionBase {
  private _colorValue: ColorDef;

  public constructor(colorValue: ColorDef) {
    super();
    this._colorValue = colorValue;
  }

  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.overrideSelectedElements(vp, this._colorValue, FeatureOverrideType.ColorOnly, false, false);
    return true;
  }
}

export class ClearOverrideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearOverriddenElements(vp);
    return true;
  }
}

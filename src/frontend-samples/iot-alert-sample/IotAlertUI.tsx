/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Button, ButtonType, ReactMessage, Select, UnderlinedButton } from "@bentley/ui-core";
import { ReloadableViewport } from "Components/Viewport/ReloadableViewport";
import IotAlertApp from "./IotAlertApp";
import { ControlPane } from "Components/ControlPane/ControlPane";
import { IModelApp, IModelConnection, OutputMessagePriority, ViewChangeOptions } from "@bentley/imodeljs-frontend";

import "./IotAlert.scss";
import { MessageManager, MessageRenderer, ReactNotifyMessageDetails } from "@bentley/ui-framework";

/** React state of the Sample component */
interface IotAlertState {
  wantEmphasis: boolean;
  elementsMap: Map<string, []>;
  elementNameIdMap: Map<string, string>;
  elements: string[];
  isImodelReady: boolean;
  selectedElement: string;
  blinkingElementSet: Set<string>;
}

/** A React component that renders the UI specific for this sample */
export default class IotAlertUI extends React.Component<{ iModelName: string, iModelSelector: React.ReactNode }, IotAlertState> {

  /** Creates an Sample instance */
  constructor(props?: any) {
    super(props);
    this.state = {
      wantEmphasis: false,
      elementsMap: new Map(),
      elementNameIdMap: new Map(),
      elements: ["EX-201", "EX-202", "EX-203", "EX-204", "EX-205"],
      isImodelReady: false,
      selectedElement: "EX-201",
      blinkingElementSet: new Set<string>(),
    };
  }

  private _getElementsFromClass = (className: string, elementsMap: Map<string, []>) => {
    const classElements: any = elementsMap.get(className);
    const elementNames: any = [];
    const tempMap = new Map();
    if (classElements === undefined) {
      return elementNames;
    }
    for (const element of classElements) {
      elementNames.push(element.cOMPONENT_NAME);
      tempMap.set(element.cOMPONENT_NAME, element.id);
    }
    this.setState({ elementNameIdMap: tempMap });

    return elementNames;
  }

  private _clearAll = (wantEmphasis: boolean) => {
    MessageManager.clearMessages();
    this.setState({ blinkingElementSet: new Set<string>() });
    this.setState({ wantEmphasis });
  }

  private _onToggleEmphasis = (wantEmphasis: boolean) => {
    this.setState({ wantEmphasis });
    this._setBlinkingElementSet(this.state.selectedElement);
    MessageManager.outputMessage(new ReactNotifyMessageDetails(OutputMessagePriority.Warning, ``, this._reactMessage(this.state.selectedElement)));
    IotAlertApp.doBlinking(this.state.wantEmphasis, this.state.blinkingElementSet, this.state.elementNameIdMap);
  }

  private _reactMessage(element: string): ReactMessage {
    const reactNode = (
      <span>
        Alert! There is an issue with <UnderlinedButton onClick={async () => this._zoomToElements(element)}>{element}</UnderlinedButton>
      </span>
    );
    return ({ reactNode });
  }

  private _zoomToElements = async (id: string) => {
    const viewChangeOpts: ViewChangeOptions = {};
    viewChangeOpts.animateFrustumChange = true;
    const vp = IModelApp.viewManager.selectedView!;
    const ids = new Set<string>();
    for (const [key, value] of this.state.elementNameIdMap) {
      if (key === id) {
        ids.add(value);
      }
    }
    await vp.zoomToElements(ids, { ...viewChangeOpts });
  }

  private _classList = ["SHELL_AND_TUBE_HEAT_EXCHANGER_PAR", "VERTICAL_VESSEL_PAR", "PLATE_TYPE_HEAT_EXCHANGER", "REBOILER_PAR"];

  private _onIModelReady = async (imodel: IModelConnection) => {
    const classElementsMap = new Map();
    for (const c of this._classList) {
      const elements = await IotAlertApp.fetchElements(imodel, c);
      classElementsMap.set(c, elements);
    }
    this.setState({ elementsMap: classElementsMap });
    const elementNames = this._getElementsFromClass("SHELL_AND_TUBE_HEAT_EXCHANGER_PAR", this.state.elementsMap);
    this.setState(elementNames);
    this.setState({ selectedElement: "EX-201" });
    this.setState({ isImodelReady: true });
  }

  private _onClassChange = (e: any) => {
    const className = e.target.value;
    const elementNames = this._getElementsFromClass(className, this.state.elementsMap);
    this.setState({ elements: elementNames });
    if (className === "SHELL_AND_TUBE_HEAT_EXCHANGER_PAR") {
      this.setState({ selectedElement: "EX-201" });
    } else if (className === "VERTICAL_VESSEL_PAR") {
      this.setState({ selectedElement: "V-301" });
    } else if (className === "PLATE_TYPE_HEAT_EXCHANGER") {
      this.setState({ selectedElement: "E-101" });
    } else if (className === "REBOILER_PAR") {
      this.setState({ selectedElement: "EX-302" });
    }
  }

  private _onElementChange = (e: any) => {
    const pickedElement = e.target.value;
    this.setState({ selectedElement: pickedElement });
  }

  private _setBlinkingElementSet(selectedElement: string) {
    if (selectedElement === undefined) {
      return;
    }
    const tempSet = this.state.blinkingElementSet;
    tempSet.add(selectedElement);
    this.setState({ blinkingElementSet: tempSet });
  }

  private _removeTag = (i: any) => {
    const newTags = Array.from(this.state.blinkingElementSet);
    newTags.splice(i, 1);
    this.setState({ blinkingElementSet: new Set(newTags) });
    if (this.state.blinkingElementSet.size === 0) {
      this.setState({ wantEmphasis: false });
      MessageManager.clearMessages();
    }
  }

  /** Components for rendering the sample's instructions and controls */
  private getControls() {
    const enableCreateAlertButton = (this.state.isImodelReady && this.state.selectedElement && !this.state.blinkingElementSet.has(this.state.selectedElement));
    const enableClearAllAlertButton = this.state.isImodelReady && this.state.blinkingElementSet.size !== 0;
    const tags = Array.from(this.state.blinkingElementSet);

    return (
      <>
        <div className="sample-options-2col">
          <span>Pick class</span>
          <Select
            options={this._classList}
            onChange={this._onClassChange}
            disabled={!this.state.isImodelReady}
          />
          <span>Pick element</span>
          <Select
            options={this.state.elements}
            onChange={this._onElementChange}
            disabled={!this.state.isImodelReady}
          />
          <span>Alert</span>
          <div className="sample-options-2col-1">
            <Button buttonType={ButtonType.Primary} onClick={() => this._onToggleEmphasis(true)} disabled={!enableCreateAlertButton}>Create</Button>
            <Button buttonType={ButtonType.Primary} onClick={() => this._clearAll(false)} disabled={!enableClearAllAlertButton}>Clear all</Button>
          </div>
          <span>Active Alert(s) </span>
          {this.state.wantEmphasis ?
            <div className="input-tag">
              <div >
                <ul className="input-tag__tags">
                  {tags !== undefined ? tags.map((tag, i) => (
                    <li key={tag}>
                      <UnderlinedButton onClick={async () => this._zoomToElements(tag)}>{tag}</UnderlinedButton>
                      <button type="button" onClick={() => { this._removeTag(i); }}>+</button>
                    </li>
                  )) : ""}
                </ul>
              </div>
            </div>
            : ""}
        </div>
      </>
    );
  }

  /** The sample's render method */
  public render() {
    return (
      <>
        <MessageRenderer />
        <ControlPane instructions="Manage IoT Alerts" controls={this.getControls()} iModelSelector={this.props.iModelSelector}></ControlPane>
        <ReloadableViewport iModelName={this.props.iModelName} onIModelReady={this._onIModelReady} />
      </>
    );
  }
}

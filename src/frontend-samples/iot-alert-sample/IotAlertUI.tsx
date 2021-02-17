/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Button, ButtonType, ReactMessage, Select, UnderlinedButton } from "@bentley/ui-core";
import { ReloadableViewport } from "Components/Viewport/ReloadableViewport";
import { ColorDef } from "@bentley/imodeljs-common";
import IotAlertApp, { ClearOverrideAction, OverrideAction } from "./IotAlertApp";
import { ControlPane } from "Components/ControlPane/ControlPane";
import { IModelConnection, OutputMessagePriority } from "@bentley/imodeljs-frontend";

import "./IotAlert.scss";
import { MessageManager, MessageRenderer, ReactNotifyMessageDetails } from "@bentley/ui-framework";

/** React state of the Sample component */
interface IotAlertState {
  overrideIsActive: boolean;
  wantEmphasis: boolean;
  elementsMap: Map<string, []>;
  elementNameIdMap: Map<string, string>;
  elements: string[];
  isImodelReady: boolean;
}

/** A React component that renders the UI specific for this sample */
export default class IotAlertUI extends React.Component<{ iModelName: string, iModelSelector: React.ReactNode }, IotAlertState> {

  /** Creates an Sample instance */
  constructor(props?: any) {
    super(props);
    this.state = {
      overrideIsActive: false,
      wantEmphasis: false,
      elementsMap: new Map(),
      elementNameIdMap: new Map(),
      elements: ["EX-201", "EX-202", "EX-203", "EX-204", "EX-205"],
      isImodelReady: false,
    };
  }

  private _clearAll = (wantEmphasis: boolean) => {
    IotAlertApp.setBlinkingElements([]);
    IotAlertApp.clearSelectedElements();
    this.setState({ wantEmphasis });
  }
  private _onToggleEmphasis = (wantEmphasis: boolean) => {
    if (!wantEmphasis) {
      IotAlertApp.setBlinkingElements([]);
      IotAlertApp.clearSelectedElements();
    }
    this.setState({ wantEmphasis });
    for (const elem of IotAlertApp.getSelectedElements()) {
      IotAlertApp.setBlinkingElementSet(elem);
    }

    for (const element of IotAlertApp.getBlinkingElementSet()) {
      MessageManager.outputMessage(new ReactNotifyMessageDetails(OutputMessagePriority.Warning, ``, this._reactMessage(element)));
    }

    this._doBlinking();
  }

  private _reactMessage(element: string): ReactMessage {
    const reactNode = (
      <span>
        Alert! There is an issue with <UnderlinedButton onClick={async () => IotAlertApp.zoomToElements(element)}>{element}</UnderlinedButton>
      </span>
    );
    return ({ reactNode });
  }

  private _doBlinking = () => {
    const timer = setInterval(() => {
      setTimeout(() => {
        if (new OverrideAction(ColorDef.white).run())
          this.setState({ overrideIsActive: true });
      }, 1000);

      setTimeout(() => {
        if (new ClearOverrideAction().run())
          this.setState({ overrideIsActive: false });
      }, 2000);

      if (!this.state.wantEmphasis) {
        clearInterval(timer);
      }
    }, 2000);
  }

  private classList = ["SHELL_AND_TUBE_HEAT_EXCHANGER_PAR", "VERTICAL_VESSEL_PAR", "PLATE_TYPE_HEAT_EXCHANGER", "REBOILER_PAR"];

  private _onIModelReady = async (imodel: IModelConnection) => {
    const classElementsMap = new Map();
    for (const c of this.classList) {
      const elements = await IotAlertApp.fetchElements(imodel, c);
      classElementsMap.set(c, elements);
    }
    this.setState({ elementsMap: classElementsMap });
    const elementNames = IotAlertApp.getElementsFromClass("SHELL_AND_TUBE_HEAT_EXCHANGER_PAR", this.state.elementsMap);
    this.setState(elementNames);
    IotAlertApp.setSelectedElements("EX-201");
    this.setState({ isImodelReady: true });
  }

  private _onClassChange = (e: any) => {
    const className = e.target.value;
    const elementNames = IotAlertApp.getElementsFromClass(className, this.state.elementsMap);
    this.setState({ elements: elementNames });
    if (className === "SHELL_AND_TUBE_HEAT_EXCHANGER_PAR") {
      IotAlertApp.setSelectedElements("EX-201");
    } else if (className === "VERTICAL_VESSEL_PAR") {
      IotAlertApp.setSelectedElements("V-301");
    } else if (className === "PLATE_TYPE_HEAT_EXCHANGER") {
      IotAlertApp.setSelectedElements("E-101");
    } else if (className === "REBOILER_PAR") {
      IotAlertApp.setSelectedElements("EX-302");
    }
  }

  private _onElementChange = (e: any) => {
    const selectedElement = e.target.value;
    IotAlertApp.setSelectedElements(selectedElement);
  }

  private _removeTag = (i: any) => {
    const newTags = Array.from(IotAlertApp.getBlinkingElementSet());
    newTags.splice(i, 1);
    IotAlertApp.setBlinkingElements(newTags);
    if (IotAlertApp.getBlinkingElementSet().size === 0) {
      this.setState({ wantEmphasis: false });
      IotAlertApp.clearSelectedElements();
    }
  }

  /** Components for rendering the sample's instructions and controls */
  private getControls() {
    const enableCreateAlertButton = this.state.isImodelReady && IotAlertApp.getBlinkingElementSet().size === 0;
    const enableClearAllAlertButton = this.state.isImodelReady && IotAlertApp.getBlinkingElementSet().size !== 0;
    const tags = Array.from(IotAlertApp.getBlinkingElementSet());

    return (
      <>
        <div className="sample-options-2col">
          <span>Select class</span>
          <Select
            options={this.classList}
            onChange={this._onClassChange}
            disabled={!this.state.isImodelReady}
          />
          <span>Select element</span>
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
                      <UnderlinedButton onClick={async () => IotAlertApp.zoomToElements(tag)}>{tag}</UnderlinedButton>
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

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { Button, ButtonType, MessageSeverity, Select, UnderlinedButton } from "@bentley/ui-core";
import { ReloadableViewport } from "Components/Viewport/ReloadableViewport";
import { ColorDef } from "@bentley/imodeljs-common";
import IotAlertApp, { ClearOverrideAction, OverrideAction } from "./IotAlertApp";
import { ControlPane } from "Components/ControlPane/ControlPane";
import { IModelConnection, NotifyMessageDetails, OutputMessageAlert, OutputMessagePriority, OutputMessageType } from "@bentley/imodeljs-frontend";

import "./IotAlert.scss";
import { ToastMessage } from "@bentley/ui-framework";
// import { RelativePosition } from "@bentley/ui-abstract";
// import { Point2d } from "@bentley/geometry-core";
import { BeDuration } from "@bentley/bentleyjs-core";

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
    this.doBlinking();
  }

  private doBlinking = () => {
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
    this.setState({ isImodelReady: true });
  }

  private _onClassChange = (e: any) => {
    const elementNames = IotAlertApp.getElementsFromClass(e.target.value, this.state.elementsMap);
    this.setState({ elements: elementNames });
  }

  private _onElementChange = (e: any) => {
    const selectedElement = e.target.value;
    IotAlertApp.setSelectedElements(selectedElement);
  }

  private removeTag = (i: any) => {
    const newTags = Array.from(IotAlertApp.getBlinkingElementSet());
    newTags.splice(i, 1);
    IotAlertApp.setBlinkingElements(newTags);
    if (IotAlertApp.getBlinkingElementSet().size === 0) {
      this.setState({ wantEmphasis: false });
      IotAlertApp.clearSelectedElements();
    }
  }

  private createMessage = (tag: any) => {
    // const vp = IModelApp.viewManager.selectedView!;
    // const width = 376;
    // const height = 110;
    // const y = window.innerHeight - height - 3;
    // const x = (window.innerWidth - width) / 6;
    const notifyMessage = new NotifyMessageDetails(OutputMessagePriority.Warning, ``, `Alert! There is an issue with ${tag}.`, OutputMessageType.Toast, OutputMessageAlert.None);
    // notifyMessage.relativePosition = RelativePosition.Bottom;
    // notifyMessage.displayPoint = new Point2d(1119, 718);
    notifyMessage.displayTime = BeDuration.fromMilliseconds(5000);
    // notifyMessage.viewport = vp.target;
    return notifyMessage;
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
                      <button type="button" onClick={() => { this.removeTag(i); }}>+</button>
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
        {
          this.state.wantEmphasis && Array.from(IotAlertApp.getBlinkingElementSet()) !== undefined ? Array.from(IotAlertApp.getBlinkingElementSet()).map((tag) => (
            // <MessageBox onButtonClick={async () => IotAlertApp.zoomToElements(tag)} isOpen={this.state.wantEmphasis} message={`Alert coming from element ${tag}.`} id={tag} key={tag} />
            <ToastMessage id={tag} messageDetails={this.createMessage(tag)} severity={MessageSeverity.Warning} toastTarget={null} closeMessage={() => { }} key={tag} />
          )) : ""
        }
        <ControlPane instructions="Manage IoT Alerts" controls={this.getControls()} iModelSelector={this.props.iModelSelector}></ControlPane>
        <ReloadableViewport iModelName={this.props.iModelName} onIModelReady={this._onIModelReady} />
      </>
    );
  }
}
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { CommonProps, Dialog, MessageContainer, MessageSeverity, NoChildrenProps, Rectangle, Timer } from "@bentley/ui-core";
import IotAlertApp from "./IotAlertApp";
import { RelativePosition } from "@bentley/ui-abstract";
import { BeDuration } from "@bentley/bentleyjs-core";
import { NotifyMessageDetails, OutputMessageAlert, OutputMessagePriority, OutputMessageType } from "@bentley/imodeljs-frontend";
import { ToastMessage } from "@bentley/ui-framework";
import "./Toast.scss";
import classnames from "classnames";
import { CSSTransition } from 'react-transition-group';

// import { CommonProps, NoChildrenProps, Rectangle, Timer } from "@bentley/ui-core";
import { Css } from "./Css";

export interface IotAlertProps {
  id: string;
  message: string;
  isOpen: boolean;
  onButtonClick: () => void;
}

export interface IOTAlertState {
  isMessageBoxOpen: boolean;
}
export class MessageBox extends React.Component<IotAlertProps, IOTAlertState> {
  public static readonly id = "Alert";
  public static isOpen = true;
  constructor(props?: any) {
    super(props);
    this.state = {
      isMessageBoxOpen: this.props.isOpen,
      // this.exampleRef = React.createRef(),

    };

  }

  // private deleteMessageBox = setTimeout(() => {
  //   if (!IotAlertApp.getTags().includes(this.props.id)) {
  //     this._onCancel();
  //   }
  // }, 1000);

  // user closed the modeless dialog
  private _onCancel = () => {
    this.setState({ isMessageBoxOpen: false });
  }

  private createMessage = (tag: any) => {
    // const vp = IModelApp.viewManager.selectedView!;
    // const width = 376;
    // const height = 110;
    // const y = window.innerHeight - height - 3;
    // const x = (window.innerWidth - width) / 6;
    const notifyMessage = new NotifyMessageDetails(OutputMessagePriority.Warning, ``, `Alert coming from element ${tag}.`, OutputMessageType.Toast, OutputMessageAlert.None);
    notifyMessage.relativePosition = RelativePosition.BottomLeft;
    // notifyMessage.displayPoint = new Point2d(19, 78);
    notifyMessage.displayTime = BeDuration.fromMilliseconds(5000);
    // IModelApp.notifications.outputMessage(notifyMessage);
    // notifyMessage.viewport = vp.target;
    return notifyMessage;
  }

  public render(): JSX.Element {
    const width = 376;
    const height = 110;
    const y = window.innerHeight - height - 3;
    const x = (window.innerWidth - width) / 6;
    return (
      // <ToastMessage id={"tag"} messageDetails={this.createMessage("tag")} severity={MessageSeverity.Warning} toastTarget={document.createElement("div").} closeMessage={() => { }} />
      // <CSSTransition
      //   in={this.state.isOpen}
      //   timeout={300}
      //   classNames="dialog"
      // >
      <Dialog

        title={"IoT Alert"}
        modelessId={MessageBox.id}
        opened={this.state.isMessageBoxOpen && Array.from(IotAlertApp.getBlinkingElementSet()).includes(this.props.id)}
        resizable={false}
        movable={true}
        modal={true}
        onClose={() => this._onCancel()}
        onEscape={() => this._onCancel()}
        width={width} height={height}
        x={x} y={y}
      >
        <MessageContainer severity={MessageSeverity.Warning}>
          {this.renderContent()}
        </MessageContainer>
      </Dialog>
      // </CSSTransition >
    );
  }

  public renderContent() {
    return (
      <div>
        <span>{this.props.message}</span>
        <br />
        <button onClick={this.props.onButtonClick}>
          <span>Go to issue</span>
        </button>
      </div>
    );
  }
}

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Message
 */



/** Properties of [[Toast]] component.
 * @alpha Review naming of: animateOutTo, content, onAnimatedOut
 */
export interface ToastProps extends CommonProps, NoChildrenProps {
  /** Element to which the toast will animate out to. */
  animateOutTo?: HTMLElement | null;
  /** Message content. */
  content?: React.ReactNode;
  /** Function called when toast finishes to animate out. */
  onAnimatedOut?: () => void;
  /** Describes timeout after which the toast starts to animate out (in ms). Defaults to 2000. */
  timeout: number;
}

/** Default properties of [[Toast]] component.
 * @alpha
 */
export type ToastDefaultProps = Pick<ToastProps, "timeout">;

enum Stage {
  Visible,
  AnimatingOut,
  AnimatedOut,
}

class StageHelpers {
  public static readonly VISIBLE_CLASS_NAME = "nz-stage-visible";
  public static readonly ANIMATING_OUT_CLASS_NAME = "nz-stage-animating";
  public static readonly ANIMATED_OUT_CLASS_NAME = "nz-stage-animated";

  public static getCssClassName(state: Stage): string {
    switch (state) {
      case Stage.Visible:
        return StageHelpers.VISIBLE_CLASS_NAME;
      case Stage.AnimatingOut:
        return StageHelpers.ANIMATING_OUT_CLASS_NAME;
      case Stage.AnimatedOut:
        return StageHelpers.ANIMATED_OUT_CLASS_NAME;
    }
  }
}

/** State of [[Toast]] component. */
interface ToastState {
  /** Describes current toast stage. */
  stage: Stage;
  /** Toast style that is applied based on current stage. */
  toastStyle: ToastStyle;
}

/** Toast style.
 * @alpha
 */
export type ToastStyle = Pick<React.CSSProperties, "width" | "height">;

/** Footer message that animates out to specified element after some timeout. Used in [[Footer]] component.
 * @alpha
 */
export class Toast extends React.PureComponent<ToastProps, ToastState> {
  public static readonly defaultProps: ToastDefaultProps = {
    timeout: 2000,
  };

  private _timer = new Timer(Toast.defaultProps.timeout);
  private _toast = React.createRef<HTMLDivElement>();

  public constructor(props: ToastProps) {
    super(props);

    this.state = {
      stage: Stage.Visible,
      toastStyle: {
        height: undefined,
        width: undefined,
      },
    };
  }

  public componentDidMount(): void {
    this._timer.setOnExecute(() => this.setStage(Stage.AnimatingOut));
    this._timer.delay = this.props.timeout;
    this._timer.start();
  }

  public componentWillUnmount(): void {
    this._timer.stop();
  }

  public render() {
    const className = classnames(
      "nz-footer-message-toast",
      StageHelpers.getCssClassName(this.state.stage),
      this.props.className);

    return (
      <div
        className={className}
        style={this.props.style}
      >
        <div
          className="nz-toast"
          ref={this._toast}
          onTransitionEnd={this._handleTransitionEnd}
          style={this.state.toastStyle}
        >
          {this.props.content}
        </div>
      </div>
    );
  }

  private _handleTransitionEnd = () => {
    this.setStage(Stage.AnimatedOut);
  };

  private setStage(stage: Stage) {
    this.setState((prevState) => ({
      ...prevState,
      stage,
    }), () => {
      if (this.state.stage === Stage.AnimatingOut) {
        this.animateOut();
        return;
      }
      this.props.onAnimatedOut && this.props.onAnimatedOut();
    });
  }

  private animateOut() {
    if (!this._toast.current || !this.props.animateOutTo)
      return;

    const animateTo = Rectangle.create(this.props.animateOutTo.getBoundingClientRect());
    const toast = Rectangle.create(this._toast.current.getBoundingClientRect());
    const offset = toast.center().getOffsetTo(animateTo.center()).offsetY(-toast.getHeight() / 2);

    this._toast.current.style.transform = `translate(${offset.x}px, ${offset.y}px)`;

    window.requestAnimationFrame(() => {
      if (!this._toast.current)
        return;

      this._toast.current.style.width = Css.toPx(toast.getWidth());
      this._toast.current.style.height = Css.toPx(toast.getHeight());

      window.requestAnimationFrame(() => {
        if (!this._toast.current)
          return;

        this._toast.current.style.width = Css.toPx(0);
        this._toast.current.style.height = Css.toPx(0);
      });
    });
  }
}

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SampleSpec } from "../../Components/SampleShowcase/SampleShowcase";
import IotAlertApp from "./IotAlertApp";
import { SampleIModels } from "Components/IModelSelector/IModelSelector";

export function getIotAlertSpec(): SampleSpec {
  return ({
    name: "iot-alert-sample",
    label: "IOT Alerts",
    image: "iot-alert-thumbnail.png",
    readme: { name: "readme.md", import: import("!!raw-loader!./readme.md") },
    files: [
      { name: "IotAlertApp.tsx", import: import("!!raw-loader!./IotAlertApp"), entry: true },
      { name: "IotAlertUI.tsx", import: import("!!raw-loader!./IotAlertUI") },
    ],
    customModelList: [SampleIModels.MetroStation],
    setup: IotAlertApp.setup.bind(IotAlertApp),
    teardown: IotAlertApp.teardown.bind(IotAlertApp),
  });
}
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { SampleSpec } from "../../../Components/SampleShowcase/SampleShowcase";
import BasicTreeSample from "./BasicTree";

export function getBasicTreeSpec(): SampleSpec {
  return ({
    name: "basic-tree-sample",
    label: "Basic Tree",
    image: "basic-tree-thumbnail.png",
    customModelList: [],
    files: [
      { name: "BasicTree.tsx", import: import("!!raw-loader!./BasicTree"), entry: true },
    ],
    setup: BasicTreeSample.setup,
  });
}
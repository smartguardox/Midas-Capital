import { IrmTypes } from "@midas-capital/types";

const baseIrms = [IrmTypes.WhitePaperInterestRateModel, IrmTypes.JumpRateModel];

const irms: IrmTypes[] = [
  ...baseIrms,
  IrmTypes.AnkrBNBInterestRateModel,
  IrmTypes.JumpRateModel_JARVIS_2_004_4_08,
  IrmTypes.AdjustableJumpRateModel_PSTAKE_WBNB,
];

export default irms;

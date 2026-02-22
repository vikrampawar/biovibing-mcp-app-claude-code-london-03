import { generateHelpers, useSendFollowUpMessage } from "skybridge/web";
import type { AppType } from "../../server/src/index.js";

export const { useToolInfo } = generateHelpers<AppType>();
export { useSendFollowUpMessage };

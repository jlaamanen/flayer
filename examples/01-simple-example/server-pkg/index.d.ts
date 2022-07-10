/// <reference path="./products/index.d.ts" />
/// <reference path="./module/subModule/subSubModule/index.d.ts" />
declare module "server-pkg" {
    export { configure, getContext } from "flayer/dist/lib";
}

/**
 * @typedef {Object} LogRepositoryPort
 * @property {(key:{entityType:string,entityId:string,notificationUrl:string})=>Promise<any>} findOne
 * @property {(key:any, patch:any)=>Promise<any>} upsertWithSetOnInsert
 */
export const LogRepositoryPort = {};

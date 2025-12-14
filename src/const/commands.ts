export enum Commands {
  Start = 'start',
  Help = 'help',
  Event = 'event',
  AddAdmin = 'addAdmin',
  RemoveAdmin = 'removeAdmin',
  AddPlayer = 'addPlayer',
  RemovePlayer = 'removePlayer',
  UpdateDescription = 'updateDescription',
  UpdateMax = 'updateMax',
  NotifyAll = 'notifyAll',
}

export enum EventTypes {
  CallbackQueryData = 'callback_query:data',
}

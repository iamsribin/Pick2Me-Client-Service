

export const emitSocket = (event:string, data:any) => {
    return {
      type:"socket/emit", 
      payload: {
        event,
        data,
      }
    };
}
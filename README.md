# bittodo

The worlds first cryptographically secure decentralized todo list app



``` js
task1 = {
  type: 'task',
  text: '...', //description of task.
  task: {
  state: 'open',
  //name who can declare this task done.
  //by default, assign to self.
  estimate: 5, //estimated time in minutes, +- 100%
  assigned: [{feed: <ip>}],
  }
}
```

``` js
{
  type: 'task',
  root: {msg: <task1_id>}
  parents: [{msg: <task1_id>}],
  task: {
    //each of the following lines MAY be provided, to update the task:

    //mark the task as done, or canceled.
    //new state -> done|cancel
    state: 'done',

    //reestimate time for the task.
    estimate: 20,

    //wait until another task is completed.
    depends: [{msg: <another_task>}],
  }
}
```

// merge chains?


## queries

create task
render todo list.
  - show tasks:
    1. not already done
    2. not dependent on an undone task
    3. assigned to me

map:
  return [
    //assignee of the task
    msg.content.assigned.feed || msg.author, 

## License

MIT

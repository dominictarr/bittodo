# bittodo

The worlds first cryptographically secure decentralized todo list app

This is a proof of concept example application built on top of
[secure-scuttlebutt](https://github.com/ssbc/secure-scuttlebutt)

## features

* create tasks
* assign tasks to someone
* set time estimates for tasks
* set dependee tasks - a task that must be completed before a dependant task can be.
  This can be used to represent a "subtask", but is more general,
  because multiple different dependant tasks can depend on one dependee task.
* mark tasks as done.
* list actionable tasks (tasks not blocked by a incomplete dependee task)
* list unactionable tasks.

## License

MIT

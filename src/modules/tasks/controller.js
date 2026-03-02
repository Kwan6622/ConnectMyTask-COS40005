const taskService = require('./service');

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const tasks = await taskService.listTasks(req.query);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await taskService.getTaskById(id);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(id, status);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await taskService.updateTask(id, req.body);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
};


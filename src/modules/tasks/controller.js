const taskService = require('./service');

function sanitizeRiskData(data, user) {
  const role = user?.role ? String(user.role).toUpperCase() : '';
  if (role === 'PROVIDER' || role === 'ADMIN') {
    return data;
  }

  const cleanObj = (obj) => {
    if (obj && typeof obj === 'object') {
      delete obj.isSuspicious;
      delete obj.suspiciousReason;
      delete obj.riskLevel;
    }
  };

  if (Array.isArray(data)) {
    data.forEach(cleanObj);
  } else if (data && typeof data === 'object') {
    cleanObj(data);
    if (data.task) cleanObj(data.task);
  }

  return data;
}

async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body, req.user);
    res.status(201).json(sanitizeRiskData(task, req.user));
  } catch (err) {
    next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const tasks = await taskService.listTasks(req.query);
    res.json(sanitizeRiskData(tasks, req.user));
  } catch (err) {
    next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await taskService.getTaskById(id);
    res.json(sanitizeRiskData(task, req.user));
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const task = await taskService.updateTaskStatus(id, status, req.user);
    res.json(sanitizeRiskData(task, req.user));
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const task = await taskService.updateTask(id, req.body, req.user);
    res.json(sanitizeRiskData(task, req.user));
  } catch (err) {
    next(err);
  }
}

async function saveTask(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const taskId = parseInt(req.params.id, 10);
    const saved = await taskService.saveTask(userId, taskId);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

async function unsaveTask(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const taskId = parseInt(req.params.id, 10);
    const result = await taskService.unsaveTask(userId, taskId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listSavedTasks(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const savedTasks = await taskService.listSavedTasks(userId);
    res.json(sanitizeRiskData(savedTasks, req.user));
  } catch (err) {
    next(err);
  }
}

async function assignProvider(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { bidId } = req.body;
    const bid = await taskService.assignProvider(taskId, bidId, req.user);
    res.json({ success: true, bid });
  } catch (err) {
    next(err);
  }
}

async function listRequesterTasks(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const tasks = await taskService.listRequesterTasks(userId, req.user);
    return res.json(sanitizeRiskData(tasks, req.user));
  } catch (err) {
    return next(err);
  }
}

async function listProviderAssignedTasks(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const tasks = await taskService.listAssignedTasks(userId, req.user);
    return res.json(sanitizeRiskData(tasks, req.user));
  } catch (err) {
    return next(err);
  }
}

async function listSuggestedTasksForProvider(req, res, next) {
  try {
    const tasks = await taskService.listSuggestedTasksForProvider(req.user);
    return res.json(sanitizeRiskData(tasks, req.user));
  } catch (err) {
    return next(err);
  }
}

async function getTaskProgress(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const data = await taskService.getTaskProgress(taskId, req.user);
    return res.json(sanitizeRiskData(data, req.user));
  } catch (err) {
    return next(err);
  }
}

async function createTaskProgressUpdate(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const data = await taskService.createTaskProgressUpdate(taskId, req.body, req.user);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
}

async function updateTaskSubtaskStatus(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const subtaskId = parseInt(req.params.subtaskId, 10);
    const data = await taskService.updateTaskSubtaskStatus(taskId, subtaskId, req.body, req.user);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function confirmTaskCompletion(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const data = await taskService.confirmTaskCompletion(taskId, req.user);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function getTaskActivity(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const logs = await taskService.getTaskActivity(taskId, req.user);
    return res.json(logs);
  } catch (err) {
    return next(err);
  }
}

async function openTaskDispute(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const dispute = await taskService.openTaskDispute(taskId, req.body, req.user);
    return res.status(201).json(dispute);
  } catch (err) {
    return next(err);
  }
}

async function listTaskDisputes(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const disputes = await taskService.listTaskDisputes(taskId, req.user);
    return res.json(disputes);
  } catch (err) {
    return next(err);
  }
}

async function reviewDisputeByAdmin(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const disputeId = parseInt(req.params.disputeId, 10);
    const result = await taskService.reviewDisputeByAdmin(taskId, disputeId, req.body, req.user);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function cancelTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const data = await taskService.cancelTask(taskId, req.body.reason, req.user);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function listAllDisputesForAdmin(req, res, next) {
  try {
    const disputes = await taskService.listAllDisputesForAdmin(req.user);
    return res.json(disputes);
  } catch (err) {
    return next(err);
  }
}

async function verifyOnSite(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const task = await taskService.verifyOnSite(taskId, req.user);
    return res.json(sanitizeRiskData(task, req.user));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  saveTask,
  unsaveTask,
  listSavedTasks,
  assignProvider,
  listRequesterTasks,
  listProviderAssignedTasks,
  listSuggestedTasksForProvider,
  getTaskProgress,
  updateTaskSubtaskStatus,
  createTaskProgressUpdate,
  confirmTaskCompletion,
  getTaskActivity,
  openTaskDispute,
  listTaskDisputes,
  reviewDisputeByAdmin,
  cancelTask,
  listAllDisputesForAdmin,
  verifyOnSite,
};


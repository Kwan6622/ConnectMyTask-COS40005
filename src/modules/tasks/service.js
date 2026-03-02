const taskRepository = require('./repository');

function validateImageUrls(imageUrls) {
  if (!imageUrls) return;
  if (!Array.isArray(imageUrls)) {
    const err = new Error('imageUrls must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (imageUrls.length > 3) {
    const err = new Error('Max 3 images per task');
    err.statusCode = 400;
    throw err;
  }
  for (const url of imageUrls) {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith('http')) {
        throw new Error('Invalid URL');
      }
    } catch (error) {
      const err = new Error('Invalid image URL');
      err.statusCode = 400;
      throw err;
    }
  }
}

async function createTask(payload) {
  validateImageUrls(payload.imageUrls);
  return taskRepository.createTask({
    ...payload,
    status: 'OPEN',
  });
}

async function listTasks(filters) {
  return taskRepository.listTasks(filters);
}

async function getTaskById(id) {
  const task = await taskRepository.getTaskById(id);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
}

async function updateTaskStatus(id, status) {
  await getTaskById(id);
  return taskRepository.updateTaskStatus(id, status);
}

async function updateTask(id, payload) {
  await getTaskById(id);
  validateImageUrls(payload.imageUrls);
  return taskRepository.updateTask(id, payload);
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
};


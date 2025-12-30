export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export const formatProject = (project) => {
  if (!project) return null;

  const projectObj = project.toObject ? project.toObject() : project;
  return {
    ...projectObj,
    id: projectObj._id ? projectObj._id.toString() : projectObj.id,
    ownerId: projectObj.ownerId ? (typeof projectObj.ownerId === 'object' ? projectObj.ownerId._id?.toString() : projectObj.ownerId.toString()) : null,
    members: projectObj.members?.map(m => ({
      ...m,
      userId: m.userId ? (typeof m.userId === 'object' ? m.userId._id?.toString() : m.userId.toString()) : m.userId,
    })),
  };
};

export const formatTicket = (ticket) => {
  if (!ticket) return null;

  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  return {
    ...ticketObj,
    id: ticketObj._id ? ticketObj._id.toString() : ticketObj.id,
    projectId: ticketObj.projectId ? (typeof ticketObj.projectId === 'object' ? ticketObj.projectId._id?.toString() : ticketObj.projectId.toString()) : null,
    creatorId: ticketObj.creatorId ? (typeof ticketObj.creatorId === 'object' ? ticketObj.creatorId._id?.toString() : ticketObj.creatorId.toString()) : null,
    assignees: ticketObj.assignees?.map(a => {
      if (typeof a === 'object') {
        return {
          id: a._id?.toString(),
          email: a.email,
          fullName: a.fullName,
        };
      }
      return a.toString();
    }),
  };
};

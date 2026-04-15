const allowedTransitions = {
  CREATED: ['MATCHED'],
  MATCHED: ['SELECTED'],
  SELECTED: ['PAID'],
  PAID: ['COMPLETED'],
  COMPLETED: ['CONFIRMED'],
  CONFIRMED: ['CLOSED'],
  
};

const validateTransition = (currentStatus, newStatus) => {
  const allowed = allowedTransitions[currentStatus];

  if (!allowed.includes(newStatus)) {
    const error = new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    );
    error.statusCode = 400;
    throw error;
  }

   return true;
};

module.exports = { validateTransition };

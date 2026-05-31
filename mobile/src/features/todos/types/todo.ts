export type TodoStatus = 'pending' | 'completed';

export type TodoPriority = 1 | 2 | 3;

export type Todo = {
  id: string;
  title: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  dueAt?: string;
  completedAt?: string;
  deletedAt?: string;
  notificationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoInput = {
  title: string;
  description?: string;
  priority: TodoPriority;
  dueAt?: string;
  notificationId?: string;
};

export type UpdateTodoInput = Partial<CreateTodoInput> & {
  status?: TodoStatus;
  completedAt?: string;
  deletedAt?: string;
};

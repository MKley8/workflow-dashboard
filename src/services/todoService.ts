import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { TodoItem, TodoItemInput } from '../types/todo'

const COLLECTION = 'todos'

function toTodo(docSnap: { id: string; data: () => Record<string, unknown> }): TodoItem {
  return { id: docSnap.id, ...(docSnap.data() as Omit<TodoItem, 'id'>) }
}

/**
 * Realtime subscription to every task assigned to a user, newest first.
 * Sorted client-side so no Firestore composite index is required.
 */
export function subscribeToMyTodos(
  uid: string,
  onChange: (todos: TodoItem[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where('assignedToUids', 'array-contains', uid))
  return onSnapshot(
    q,
    (snapshot) => {
      const todos = snapshot.docs.map(toTodo)
      todos.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
      onChange(todos)
    },
    onError,
  )
}

export async function createTodo(input: TodoItemInput): Promise<void> {
  // Firestore rejects `undefined` field values outright, so strip any out
  // (e.g. an omitted optional `description`) before writing.
  const clean = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  )
  await addDoc(collection(db, COLLECTION), {
    ...clean,
    done: false,
    createdAt: serverTimestamp(),
    doneAt: null,
  })
}

export async function setTodoDone(todoId: string, done: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, todoId), {
    done,
    doneAt: done ? serverTimestamp() : null,
  })
}

export async function deleteTodo(todoId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, todoId))
}

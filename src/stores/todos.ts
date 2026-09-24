import { defineStore } from 'pinia'
import type { Unsubscribe } from 'firebase/firestore'
import type { TodoItem, TodoItemInput } from '../types/todo'
import { createTodo, deleteTodo, setTodoDone, subscribeToMyTodos } from '../services/todoService'

interface TodosState {
  mine: TodoItem[]
  unsubscribe: Unsubscribe | null
}

export const useTodosStore = defineStore('todos', {
  state: (): TodosState => ({
    mine: [],
    unsubscribe: null,
  }),
  getters: {
    active: (state) => state.mine.filter((t) => !t.done),
    doneItems: (state) => state.mine.filter((t) => t.done),
    /** Maps a catalog app id to the active (not-done) tasks linked to it, for tile hover previews. */
    activeByAppId(): Record<string, TodoItem[]> {
      const map: Record<string, TodoItem[]> = {}
      for (const todo of this.active) {
        for (const appId of todo.linkedAppIds) {
          if (!map[appId]) map[appId] = []
          map[appId].push(todo)
        }
      }
      return map
    },
  },
  actions: {
    subscribe(uid: string) {
      if (this.unsubscribe) return
      this.unsubscribe = subscribeToMyTodos(uid, (todos) => {
        this.mine = todos
      })
    },
    teardown() {
      this.unsubscribe?.()
      this.unsubscribe = null
      this.mine = []
    },
    async create(input: TodoItemInput) {
      await createTodo(input)
    },
    async setDone(todoId: string, done: boolean) {
      await setTodoDone(todoId, done)
    },
    async remove(todoId: string) {
      await deleteTodo(todoId)
    },
  },
})

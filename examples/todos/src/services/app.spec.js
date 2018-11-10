import { modelFactory, eventCreatorFactory } from './app';
import { filters } from '../aggregates/visibilityFilter';

describe('app service', () => {
  describe('modelFactory', () => {
    it('computes the app modelfrom modelFactory', () => {
      const todos = [
        { id: 1, text: 'Write Test', completed: true },
        { id: 2, text: 'Write Code', completed: false },
        { id: 3, text: 'Write Doc', completed: false },
      ];

      expect(modelFactory(todos, filters.SHOW_ALL)).toEqual({ list: todos, todoIds: [1, 2, 3] });
      expect(modelFactory(todos, filters.SHOW_COMPLETED)).toEqual({
        list: [todos[0]],
        todoIds: [1],
      });
      expect(modelFactory(todos, filters.SHOW_ACTIVE)).toEqual({
        list: [todos[1], todos[2]],
        todoIds: [2, 3],
      });
    });
  });

  describe('eventCreatorFactory', () => {
    let createEvent;
    let todo;
    let visibilityFilter;

    beforeEach(() => {
      createEvent = jest.fn().mockReturnValue('createEvent()');
      todo = { add: jest.fn().mockReturnValue('todo.add()') };
      visibilityFilter = { set: jest.fn().mockReturnValue('visiblityFilter.set()') };
    });

    it('makes only 1 event', () => {
      const eventCreators = eventCreatorFactory(todo, visibilityFilter)(createEvent);

      expect(Object.keys(eventCreators).sort()).toEqual(['create'].sort());
    });

    it('makes "create" event', () => {
      const eventCreators = eventCreatorFactory(todo, visibilityFilter)(createEvent);

      expect(Object.keys(eventCreators).sort()).toEqual(['create'].sort());
      expect(eventCreators.create('test todo')).toEqual('createEvent()');
      expect(createEvent).toBeCalledWith(['todo.add()', 'visiblityFilter.set()']);
      expect(todo.add).toBeCalledWith('test todo');
      expect(visibilityFilter.set).toBeCalledWith(filters.SHOW_ALL);
    });
  });
});

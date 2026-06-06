import { createAppEventSource, emitAppEvent, subscribeToAppEvent } from "./app-events";

describe("app events", () => {
  it("notifies subscribers and supports unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToAppEvent("habitsChanged", listener);

    emitAppEvent("habitsChanged", { source: "test-source" });
    unsubscribe();
    emitAppEvent("habitsChanged");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ source: "test-source" });
  });

  it("keeps different event names isolated", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToAppEvent("todosChanged", listener);

    emitAppEvent("habitsChanged");
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });

  it("creates stable unique event source ids", () => {
    expect(createAppEventSource("todos")).toMatch(/^todos_\d+$/);
    expect(createAppEventSource("todos")).not.toBe(createAppEventSource("todos"));
  });
});

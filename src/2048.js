(function attachGame2048(root) {
  function createInitialState(random = Math.random) {
    const board = Array.from({ length: 4 }, () => Array(4).fill(null));
    const emptyCells = Array.from({ length: 16 }, (_, index) => [Math.floor(index / 4), index % 4]);

    for (let index = 0; index < 2; index += 1) {
      const emptyIndex = Math.floor(random() * emptyCells.length);
      const [row, column] = emptyCells.splice(emptyIndex, 1)[0];
      board[row][column] = 2;
    }

    return { board, score: 0, status: 'playing', hasWon: false };
  }

  function coordinatesForLine(direction, lineIndex) {
    return Array.from({ length: 4 }, (_, position) => {
      switch (direction) {
        case 'left': return [lineIndex, position];
        case 'right': return [lineIndex, 3 - position];
        case 'up': return [position, lineIndex];
        case 'down': return [3 - position, lineIndex];
      }
    });
  }

  function hasMoves(board) {
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const value = board[row][column];
        if (value === null) return true;
        if (column < 3 && value === board[row][column + 1]) return true;
        if (row < 3 && value === board[row + 1][column]) return true;
      }
    }
    return false;
  }

  function makeMove(state, direction, random = Math.random) {
    const board = state.board.map(row => row.slice());
    const directions = ['up', 'down', 'left', 'right'];
    if (state.status !== 'playing' || !directions.includes(direction)) {
      return { ...state, board };
    }

    let scoreGained = 0;

    for (let lineIndex = 0; lineIndex < 4; lineIndex += 1) {
      const coordinates = coordinatesForLine(direction, lineIndex);
      const values = coordinates
        .map(([row, column]) => board[row][column])
        .filter(value => value !== null);
      const mergedValues = [];

      for (let index = 0; index < values.length; index += 1) {
        if (values[index] === values[index + 1]) {
          const mergedValue = values[index] * 2;
          mergedValues.push(mergedValue);
          scoreGained += mergedValue;
          index += 1;
        } else {
          mergedValues.push(values[index]);
        }
      }

      coordinates.forEach(([row, column], index) => {
        board[row][column] = index < mergedValues.length ? mergedValues[index] : null;
      });
    }

    const changed = board.some((row, rowIndex) =>
      row.some((value, columnIndex) => value !== state.board[rowIndex][columnIndex])
    );
    if (!changed) return { ...state, board };

    const emptyCells = [];
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        if (board[row][column] === null) emptyCells.push([row, column]);
      }
    }

    if (emptyCells.length > 0) {
      const emptyIndex = Math.floor(random() * emptyCells.length);
      const [row, column] = emptyCells[emptyIndex];
      const value = Math.floor(random() * 100) < 10 ? 4 : 2;
      board[row][column] = value;
    }

    const wonNow = !state.hasWon && board.some(row => row.some(value => value >= 2048));
    const hasWon = state.hasWon || wonNow;
    let status = wonNow ? 'victory' : 'playing';
    if (!wonNow && !hasMoves(board)) status = 'game-over';

    return {
      board,
      score: state.score + scoreGained,
      status,
      hasWon,
    };
  }

  function continueAfterVictory(state) {
    if (state.status !== 'victory') {
      return { ...state, board: state.board.map(row => row.slice()) };
    }

    const nextState = {
      ...state,
      board: state.board.map(row => row.slice()),
      status: 'playing',
      hasWon: true,
    };
    if (!hasMoves(nextState.board)) nextState.status = 'game-over';
    return nextState;
  }

  function createViewModel(state, ui = {}) {
    let modal = null;
    if (state.status === 'victory') modal = 'victory';
    else if (state.status === 'game-over') modal = 'game-over';
    else if (ui.restartConfirmationOpen) modal = 'restart-confirmation';

    return {
      score: state.score,
      scoreLabel: 'Очки',
      cells: state.board.flat().map(value => ({
        value,
        label: value === null ? 'Пустая клетка' : `Плитка ${value}`,
      })),
      modal,
    };
  }

  function getKeyboardDirection(key) {
    const directions = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    return directions[key] || null;
  }

  function getSwipeDirection(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (absoluteX < 30 && absoluteY < 30) return null;
    if (absoluteX >= absoluteY) return deltaX > 0 ? 'right' : 'left';
    return deltaY > 0 ? 'down' : 'up';
  }

  function canAcceptMove(state, modalOpen) {
    return state.status === 'playing' && !modalOpen;
  }

  function createController(initialState = createInitialState(), random = Math.random) {
    let state = { ...initialState, board: initialState.board.map(row => row.slice()) };
    let restartConfirmationOpen = false;
    let successfulMoves = 0;

    function resetGame() {
      state = createInitialState(random);
      restartConfirmationOpen = false;
      successfulMoves = 0;
    }

    function getSnapshot() {
      return {
        state: { ...state, board: state.board.map(row => row.slice()) },
        ui: { restartConfirmationOpen },
      };
    }

    function move(direction) {
      if (!canAcceptMove(state, restartConfirmationOpen)) return getSnapshot().state;
      const nextState = makeMove(state, direction, random);
      const boardChanged = nextState.board.some((row, rowIndex) =>
        row.some((value, columnIndex) => value !== state.board[rowIndex][columnIndex])
      );
      if (boardChanged) successfulMoves += 1;
      state = nextState;
      return getSnapshot().state;
    }

    function requestNewGame() {
      if (state.status === 'playing' && successfulMoves > 0) restartConfirmationOpen = true;
      else resetGame();
      return getSnapshot();
    }

    function cancelRestart() {
      restartConfirmationOpen = false;
      return getSnapshot();
    }

    function confirmRestart() {
      resetGame();
      return getSnapshot();
    }

    function continueGame() {
      state = continueAfterVictory(state);
      return getSnapshot();
    }

    function swipe(startX, startY, endX, endY) {
      const direction = getSwipeDirection(startX, startY, endX, endY);
      if (direction) move(direction);
      return direction;
    }

    return { getSnapshot, move, swipe, requestNewGame, cancelRestart, confirmRestart, continueGame };
  }

  root.Game2048 = {
    createInitialState,
    makeMove,
    continueAfterVictory,
    hasMoves,
    createViewModel,
    getKeyboardDirection,
    getSwipeDirection,
    canAcceptMove,
    createController,
  };

  if (root.document) {
    const document = root.document;
    const boardElement = document.querySelector('#game-board');
    const scoreElement = document.querySelector('#score');
    const newGameButton = document.querySelector('#new-game');
    const modalElements = {
      victory: document.querySelector('#victory-modal'),
      'game-over': document.querySelector('#game-over-modal'),
      'restart-confirmation': document.querySelector('#restart-modal'),
    };
    const controller = createController();
    let activeModal = null;
    let focusReturnElement = null;
    let swipeStart = null;

    boardElement.setAttribute('tabindex', '0');

    const app = {
      render(state = controller.getSnapshot().state, ui = controller.getSnapshot().ui) {
        const view = createViewModel(state, ui);
        const rows = Array.from({ length: 4 }, (_, rowIndex) => {
          const rowElement = document.createElement('div');
          rowElement.className = 'game-row';
          rowElement.setAttribute('role', 'row');
          const cells = view.cells.slice(rowIndex * 4, rowIndex * 4 + 4).map(cell => {
            const element = document.createElement('div');
            element.className = 'game-cell';
            element.setAttribute('role', 'gridcell');
            element.setAttribute('aria-label', cell.label);

            if (cell.value !== null) {
              const valueText = String(cell.value);
              element.textContent = valueText;
              element.dataset.value = valueText;
              element.dataset.digits = String(valueText.length);
              if (cell.value > 2048) element.dataset.highValue = 'true';
            }

            return element;
          });
          rowElement.replaceChildren(...cells);
          return rowElement;
        });

        boardElement.replaceChildren(...rows);
        scoreElement.textContent = String(view.score);
        Object.entries(modalElements).forEach(([name, element]) => {
          element.hidden = view.modal !== name;
        });

        if (view.modal && view.modal !== activeModal) {
          if (!activeModal) {
            focusReturnElement = document.activeElement === document.body ? boardElement : document.activeElement;
          }
          const firstButton = modalElements[view.modal].querySelector('button');
          if (firstButton) firstButton.focus();
        } else if (!view.modal && activeModal && focusReturnElement) {
          focusReturnElement.focus();
          focusReturnElement = null;
        }
        activeModal = view.modal;
      },
      handleMove(direction) {
        controller.move(direction);
        app.render();
      },
      handleSwipe(startX, startY, endX, endY) {
        const direction = getSwipeDirection(startX, startY, endX, endY);
        if (direction) app.handleMove(direction);
        return direction;
      },
      requestNewGame() {
        controller.requestNewGame();
        app.render();
      },
      continueGame() {
        controller.continueGame();
        app.render();
      },
    };

    document.querySelectorAll('[data-direction]').forEach(button => {
      button.addEventListener('click', () => app.handleMove(button.dataset.direction));
    });

    newGameButton.addEventListener('click', () => app.requestNewGame());

    document.querySelectorAll('[data-modal-action]').forEach(button => {
      button.addEventListener('click', () => {
        switch (button.dataset.modalAction) {
          case 'continue':
            controller.continueGame();
            break;
          case 'new-game':
          case 'confirm-restart':
            controller.confirmRestart();
            break;
          case 'cancel-restart':
            controller.cancelRestart();
            break;
        }
        app.render();
      });
    });

    document.addEventListener('keydown', event => {
      if (activeModal) {
        if (event.key === 'Escape' && activeModal === 'restart-confirmation') {
          event.preventDefault();
          controller.cancelRestart();
          app.render();
          return;
        }

        if (event.key === 'Tab') {
          const buttons = [...modalElements[activeModal].querySelectorAll('button:not([disabled])')];
          if (buttons.length > 0) {
            const firstButton = buttons[0];
            const lastButton = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === firstButton) {
              event.preventDefault();
              lastButton.focus();
            } else if (!event.shiftKey && document.activeElement === lastButton) {
              event.preventDefault();
              firstButton.focus();
            }
          }
        }
        return;
      }

      const target = event.target;
      if (target.matches('input, textarea, select, button, [contenteditable="true"]')) return;
      const direction = getKeyboardDirection(event.key);
      if (!direction || !canAcceptMove(controller.getSnapshot().state, false)) return;
      event.preventDefault();
      app.handleMove(direction);
    });

    boardElement.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      swipeStart = [event.clientX, event.clientY];
      boardElement.setPointerCapture(event.pointerId);
    });
    boardElement.addEventListener('pointerup', event => {
      if (!swipeStart) return;
      const [startX, startY] = swipeStart;
      swipeStart = null;
      app.handleSwipe(startX, startY, event.clientX, event.clientY);
    });
    boardElement.addEventListener('pointercancel', () => {
      swipeStart = null;
    });

    root.Game2048App = app;
    app.render();
  }
})(typeof window !== 'undefined' ? window : globalThis);

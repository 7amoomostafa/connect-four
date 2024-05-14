// On window load select game mode
window.addEventListener('DOMContentLoaded', () => {
  selectGameMode()
})

// Select play against computer or 2 players
const selectGameMode = () => {
  document.querySelectorAll('#selectGameMode button').forEach((btn) =>
    btn.addEventListener('click', function (e) {
      game(e.target.dataset.mode)
      document.querySelector('#selectGameMode').remove()
    })
  )
}

// Start the game
const game = (mode) => {
  const board = initBoard(BOARDHEIGHT, BOARDWIDTH)
  const maxNumberOfTurns = BOARDHEIGHT * BOARDWIDTH
  const messageElt = document.querySelector('#message')
  let turnCounter = 0
  let player = 'player1'
  let gameOver = false
  let blockedInput = false
  let vsComputer = mode === 'computer'

  document.querySelector('table').addEventListener('click', async function (e) {
    if (
      gameOver ||
      undefined === e.target.dataset.column ||
      blockedInput ||
      (vsComputer && player === 'player2')
    ) {
      return
    }
    const colNumber = parseInt(e.target.dataset.column, 10)
    const rowNumber = getLowestEmptyRowNumber(board, colNumber)
    if (rowNumber < 0) {
      return // Column is full
    }
    blockedInput = true
    turnCounter++
    await drop(board, player, rowNumber, colNumber, 0)
    if (isWinner(board, player)) {
      messageElt.textContent = `${player} has won!`
      gameOver = true
      return
    }
    if (turnCounter >= maxNumberOfTurns) {
      messageElt.textContent = `It's a draw game!`
      gameOver = true
      return
    }
    // change the player turn
    player = player === 'player1' ? 'player2' : 'player1'
    messageElt.textContent = `${player} turn`

    // Computer turn
    // Check if the second player is the computer
    if (vsComputer && player === 'player2') {
      const columnNumber = generateComputerMove(board)
      const rowNumber = getLowestEmptyRowNumber(board, columnNumber)
      turnCounter++
      await drop(board, player, rowNumber, columnNumber, 0)
      if (isWinner(board, player)) {
        messageElt.textContent = `${player} has won!`
        gameOver = true
        return
      }
      if (turnCounter === maxNumberOfTurns) {
        messageElt.textContent = `It's a draw game!`
        gameOver = true
        return
      }
      player = 'player1'
      document.querySelector('#message').textContent = `${player} turn`
    }

    blockedInput = false
  })
}

// Board dimentions
const BOARDHEIGHT = 6
const BOARDWIDTH = 7

// Set the board
const initBoard = (height, width) => {
  const boardElt = document.querySelector('#board')
  const messageElt = document.querySelector('#message')

  // Create a table inside the board
  const tableElt = document.createElement('table')

  // Add the table to the board
  boardElt.appendChild(tableElt)

  // Create a 2d array with the length and height
  const board = Array.from({ length: height }, () => [])
  // loop through the height to create the rows
  for (let i = 0; i < height; i++) {
    const rowElt = document.createElement('tr')
    // loop through the width to create the cells
    for (let j = 0; j < width; j++) {
      const cellElt = document.createElement('td')
      // make every cell empty
      cellElt.className = 'empty'
      cellElt.dataset.column = j
      rowElt.appendChild(cellElt)
      // add the cell to the board array
      board[i][j] = cellElt
    }
    tableElt.appendChild(rowElt)
  }
  boardElt.style.display = 'block'
  messageElt.style.display = 'block'
  return board
}

// Check the winner
const isWinner = (board, player) => {
  // HORIZONTAL
  for (let rowNum = 0; rowNum < BOARDHEIGHT; rowNum++) {
    const rowArray = board[rowNum]
    for (let x = 0; x < BOARDWIDTH - 3; x++) {
      const window = rowArray.slice(x, x + 4)
      if (window.filter((c) => c.className === player).length === 4) {
        return true
      }
    }
  }

  // VERTICAL
  for (let colNum = 0; colNum < BOARDWIDTH; colNum++) {
    const colArray = board.map((row) => row[colNum])
    for (let y = 0; y < BOARDHEIGHT - 3; y++) {
      const window = colArray.slice(y, y + 4)
      if (window.filter((c) => c.className === player).length === 4) {
        return true
      }
    }
  }

  for (let rowNum = 0; rowNum < BOARDHEIGHT - 3; rowNum++) {
    // DESC DIAGONAL
    for (let colNum = 0; colNum < BOARDWIDTH - 3; colNum++) {
      const window = []
      for (let i = 0; i < 4; i++) {
        window.push(board[rowNum + i][colNum + i])
      }
      if (window.filter((c) => c.className === player).length === 4) {
        return true
      }
    }
    // ASC DIAGONAL
    for (let colNum = 3; colNum < BOARDWIDTH; colNum++) {
      const window = []
      for (let i = 0; i < 4; i++) {
        window.push(board[rowNum + i][colNum - i])
      }
      if (window.filter((c) => c.className === player).length === 4) {
        return true
      }
    }
  }

  // NO WINNER
  return false
}

const generateComputerMove = (board) => {
  return minimax(board, 3, true).bestColNum
}

// Get which row the piece will be dropped
const getLowestEmptyRowNumber = (board, columnNumber) => {
  if (board[0][columnNumber].className !== 'empty') {
    return -1 // Column is full
  }
  let i = 0
  while (i < BOARDHEIGHT - 1) {
    if (board[i + 1][columnNumber].className !== 'empty') {
      return i
    }
    i++
  }
  return i
}

// drop the piece in the game board
const drop = async (board, player, rowNumber, colNumber, currentRow) => {
  board[currentRow][colNumber].className = player
  if (currentRow < rowNumber) {
    await new Promise((resolve) => {
      setTimeout(() => {
        board[currentRow][colNumber].className = 'empty'
        drop(board, player, rowNumber, colNumber, currentRow + 1).then(resolve)
      }, 50)
    })
  }
}

//  MiniMax Algorithm 
const minimax = (board, depth, maximizingPlayer) => {
  // Get allowed columns to drop the piece
  const allowedCols = getAllowedCols(board)
  // Check if the game is over
  const terminalNode = isTerminalNode(board)
  if (depth === 0 || terminalNode) {
    if (terminalNode) {
      if (isWinner(board, 'player2')) {
        return {
          bestScore: Infinity,
          bestColNum: null,
        }
      }
      if (isWinner(board, 'player1')) {
        return {
          bestScore: -Infinity,
          bestColNum: null,
        }
      }
      return {
        bestScore: 0,
        bestColNum: null,
      }
    }
    return {
      bestScore: scoreBoard(board, 'player2'),
      bestColNum: null,
    }
  }

  // Maximizing player
  if (maximizingPlayer) {
    let bestScore = -Infinity
    let bestColNum = allowedCols[Math.floor(Math.random() * allowedCols.length)]
    for (let colNum of allowedCols) {
      const boardCopy = board.map((row) =>
        row.map((cell) => ({ className: cell.className }))
      )
      boardCopy[getLowestEmptyRowNumber(board, colNum)][colNum].className =
        'player2'
      const score = minimax(boardCopy, depth - 1, false).bestScore
      if (score > bestScore) {
        bestScore = score
        bestColNum = colNum
      }
    }
    return {
      bestScore,
      bestColNum,
    }
  }

  // Minimizing player
  let bestScore = Infinity
  let bestColNum = allowedCols[Math.floor(Math.random() * allowedCols.length)]
  for (let colNum of allowedCols) {
    const boardCopy = board.map((row) =>
      row.map((cell) => ({ className: cell.className }))
    )
    boardCopy[getLowestEmptyRowNumber(board, colNum)][colNum].className =
      'player1'
    const score = minimax(boardCopy, depth - 1, true).bestScore
    if (score < bestScore) {
      bestScore = score
      bestColNum = colNum
    }
  }
  return {
    bestScore,
    bestColNum,
  }
}

// Get all the allowed to play columns
const getAllowedCols = (board) => {
  return Array.from({ length: BOARDWIDTH }, (value, index) => index).filter(
    (colNum) => board[0][colNum].className === 'empty'
  )
}

// Check if the game is over
const isTerminalNode = (board) => {
  return (
    isWinner(board, 'player1') ||
    isWinner(board, 'player2') ||
    getAllowedCols(board).length === 0
  )
}

// Check the pieces in sequence
const scoreBoard = (board, player) => {
  let score = 0
  // CENTER COLUMN
  let centerCount = 0
  for (let rowNum = 0; rowNum < BOARDHEIGHT; rowNum++) {
    if (board[rowNum][Math.floor(BOARDWIDTH / 2)].className === player) {
      centerCount++
    }
  }
  score += centerCount * 6

  // HORIZONTAL
  for (let rowNum = 0; rowNum < BOARDHEIGHT; rowNum++) {
    const rowArray = board[rowNum]
    for (let x = 0; x < BOARDWIDTH - 3; x++) {
      const window = rowArray.slice(x, x + 4)
      score += scoreWindow(window, player)
    }
  }

  // VERTICAL
  for (let colNum = 0; colNum < BOARDWIDTH; colNum++) {
    const colArray = board.map((row) => row[colNum])
    for (let y = 0; y < BOARDHEIGHT - 3; y++) {
      const window = colArray.slice(y, y + 4)
      score += scoreWindow(window, player)
    }
  }

  for (let rowNum = 0; rowNum < BOARDHEIGHT - 3; rowNum++) {
    //DESC DIAGONAL
    for (let colNum = 0; colNum < BOARDWIDTH - 3; colNum++) {
      const window = []
      for (let i = 0; i < 4; i++) {
        window.push(board[rowNum + i][colNum + i])
      }
      score += scoreWindow(window, player)
    }
    // ASC DIAGONAL
    for (let colNum = 3; colNum < BOARDWIDTH; colNum++) {
      const window = []
      for (let i = 0; i < 4; i++) {
        window.push(board[rowNum + i][colNum - i])
      }
      score += scoreWindow(window, player)
    }
  }

  return score
}

const scoreWindow = (window, player) => {
  // 
  let opponent = player === 'player2' ? 'player1' : 'player2'
  // Set the score to zero
  let score = 0

  // Check how much pieces in sequence for each player
  const nbOfPlayerCells = window.filter((c) => c.className === player).length
  const nbOfOpponentCells = window.filter(
    (c) => c.className === opponent
  ).length

  // Check the empty cells
  const nbOfEmptyCells = window.filter((c) => c.className === 'empty').length
  // Set the score based on the number of the pieces will be in sequence
  if (nbOfPlayerCells === 4) {
    score += 100
  } else if (nbOfPlayerCells === 3 && nbOfEmptyCells === 1) {
    score += 10
  } else if (nbOfPlayerCells === 2 && nbOfEmptyCells === 2) {
    score += 5
  }

  if (nbOfOpponentCells === 3 && nbOfEmptyCells === 1) {
    score -= 80
  }

  return score
}
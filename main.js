// 定義狀態：宣告一組 GAME_STATE 來當成狀態機
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

// 花色圖址
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

//  view: 畫面
const view = {
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1) //將數字轉變為對應的英文字母
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="card">
      <p>${number}</p>
    `
  },
  // 數字1, 11 ~ 13需轉成英文顯示
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 將utility改為函式的引數：indexes
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },
  // 翻牌
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      // 動畫結束事件 (animationend)
      // once: true 表示事件執行一次後，就卸載這個監聽器
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// 宣告revealedCards儲存資料：「被翻開的第一、二張卡片」
const model = {
  revealedCards: [],
  // 確認花色是否一致，回傳值為true or false
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}

// 初始狀態設定為 FirstCardAwaits，也就是「還沒翻牌」
// 之後由 controller 來推進遊戲狀態
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  // 將utility從view拉到controller統一管理
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  // 依據掀牌動作更新遊戲狀態機
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    // 翻開卡片時，依據不同情況呼叫函示
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          console.log('配對成功！！')
          // 清空暫存的卡片資料
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return // 接下來的程式會停止執行
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          // 設定計時器：1000毫秒（1秒）
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
          console.log('配對失敗，哭哭')
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

// 洗牌
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    // 從最後一張開始洗，直至第二張牌(index=1)
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

// 外部用controller呼叫函式，view隱藏於內部
controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})

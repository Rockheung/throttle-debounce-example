import isObject from './isObject.js'
import root from './.internal/root.js'

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked, or until the next browser frame is drawn. The debounced function
 * comes with a `cancel` method to cancel delayed `func` invocations and a
 * `flush` method to immediately invoke them. Provide `options` to indicate
 * whether `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. The `func` is invoked with the last arguments provided to the
 * debounced function. Subsequent calls to the debounced function return the
 * result of the last `func` invocation.
 * 
 * `func`실행을 지연시키는 디바운스된 함수를 만든다. 그 디바운스된 함수가 실행 되고 `wait 밀리초가
 * 지나기 전까지나, 그려지는 다음 브라우저 프레임 전까지.
 * 디바운스된 함수는 지연된 `func` 실행을 취소시키는 `cancel` 메서드와, 바로 실행 시키는 `flush`
 * 메서드와 함께 제공된다. 옵션이 제공되는데, `func`가 `wait`의 앞선 엣지 혹은 끝나는 엣지
 * 에서 실행할지 정할 수 있다. `func`는 디바운스된 함수에 제공된 마지막 인자들로 실행된다.
 * 디바운스된 함수에 이어지는 실행은 마지막 함수의 결과값을 반환한다.
 *
 * 
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 * 
 * `leading`과 `trailing` 옵션이 (둘다) 참이면, 끝나는 엣지에서만 실행이 된다,
 * `wait만큼 지연되는 동안 한 번 이상 디바운스된 함수가 실행되는 경우에.
 * 
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until the next tick, similar to `setTimeout` with a timeout of `0`.
 * 
 * `wait`가 0이고 `leading` 이 거짓이면, `func` 실행은 다음 tick까지 연기된다. 마치
 * `setTimeout`의 시간지연을 0으로 주었을 때처럼.
 * 
 *
 * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
 * invocation will be deferred until the next frame is drawn (typically about
 * 16ms).
 * 
 * `wait`이 `requestAnimationFrame`이 제공되는 환경에서 생략되면, `func` 실행은 다음 
 * 프레임이 그려질때까지 지연된다. (대개는 16ms)
 * 
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `debounce` and `throttle`.
 *
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0]
 *  The number of milliseconds to delay; if omitted, `requestAnimationFrame` is
 *  used (if available).
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', debounce(calculateLayout, 150))
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }))
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * const debounced = debounce(batchLog, 250, { 'maxWait': 1000 })
 * const source = new EventSource('/stream')
 * jQuery(source).on('message', debounced)
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel)
 *
 * // Check for pending invocations.
 * const status = debounced.pending() ? "Pending..." : "Ready"
 */
function debounce(func, wait, options) {
  let lastArgs,
    lastThis,
    maxWait,
    result,
    timerId,
    // 직접 실행하라고 한 시간.
    lastCallTime

    // 실행이 그래서 된 시간.
  let lastInvokeTime = 0
  let leading = false
  let maxing = false
  let trailing = true

  // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
  // requestAnimationFrame을 쓸지 판단하는 boolean
  const useRAF = (!wait && wait !== 0 && typeof root.requestAnimationFrame === 'function')

  // `func`가 함수 타입인지 판단하여 아니면 Exception 던짐.
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function')
  }

  // `wait` 타입을 number로 안전하게 처리
  wait = +wait || 0

  // isObject 구현체는 lodash github에서 알 수 있다.
  if (isObject(options)) {
    // leading: default false
    leading = !!options.leading
    // maxing: `options.maxWait`를 사용하는지 boolean
    maxing = 'maxWait' in options
    // `options.maxWait`을 사용하면, number 타입으로 안전하게, 최소 0. 아니면 
    // 그대로 로컬 `maxWait` 사용: undefined
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
    // `options.trailing` 사용하면, boolean으로 처리. 아니면 로컬 `trailing` 사용: true
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }

  // time = Date.now();
  // 현재 시간을 인자로 가지면서 `func`를 디바운스된 함수에 제공된 args로 실행.
  // lastThis, lastArgs는 undefined로 다시 초기화
  // lastInvokeTime에 invokeFunc에 의해 실행한 시간 기록.
  function invokeFunc(time) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  // pendingFunc = timerExpired
  // 실행 대기중인 함수를 macro task queue에 집어넣고 실행 대기를 걸거나,
  // 아니면 다음 프레임 혹은 tick에 실행.
  function startTimer(pendingFunc, wait) {
    if (useRAF) {
      root.cancelAnimationFrame(timerId)
      return root.requestAnimationFrame(pendingFunc)
    }
    // ? 왜 여기선 clearTimeout으로 clear 안 해주나?
    return setTimeout(pendingFunc, wait)
  }

  // id = timerId
  // timerId에 할당된 타이머를 비움.
  // startTimer에서 리턴값으로 매 실행 전에 할당되고 있다.
  function cancelTimer(id) {
    if (useRAF) {
      return root.cancelAnimationFrame(id)
    }
    clearTimeout(id)
  }

  // time = Date.now();
  // leading = false 면 실행한 시점 및 다음 실행 예약만 걸고
  // 이전 실행 결과값만 리턴하고,
  // leading = true 면 함수도 실행한다.
  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  // time = Date.now();
  // 실행 시점 기준으로 얼마나 실행을 지연시켜야 할지 계산
  // maxWait 옵션 사용 여부에 따라 반환값이 다름.
  // maxWait는 후에 추가된 옵션.
  // Math.min으로 반환의 최대값을 timeWaiting으로 정한 셈.
  function remainingWait(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxing
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  // time = Date.now();
  // 실행이 되어야 하는지 판단
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    // 
    // timeSinceLastCall < 0: 이상한 옵션인듯. true일 가능성이 있는가?
    // 실행한 적이 없거나, 
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
  }

  // 현재 시간에 기반하여 실행되어야 하는 시점이면 trailingEdge로 invokeFunc
  // 재귀적으로 다시 스스로를 macro task queue에 집어넣고, 
  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time))
  }

  function trailingEdge(time) {
    timerId = undefined

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timerId = undefined
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timerId !== undefined
  }

  function debounced(...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime)
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait)
    }
    return result
  }
  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending
  return debounced
}

export default debounce

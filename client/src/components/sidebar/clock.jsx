import { useLayoutEffect, useState } from "react";
import getClock from "@utils/getClock";

const Clock = () => {
  const [date, setDate] = useState(getClock().date);
  const [time, setTime] = useState(getClock().time);

  const changeClock = () => {
    setDate(getClock().date);
    setTime(getClock().time);
  };

  // setInterval 은 설정한 시간을 보장하지 않기 때문에 setTimeout 재귀함수 사용
  useLayoutEffect(() => {
    const clock = setTimeout(changeClock, setTimeout(changeClock, 1000), 1000);
    return () => clearTimeout(clock);
  }, [date, time]);

  return (
    <section className="clock">
      <div className="today">{date}</div>
      <div className="today">{time}</div>
    </section>
  );
};

export default Clock;
import "@styles/quiz/game.css";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilState, useResetRecoilState, useSetRecoilState } from "recoil";
import { useQuery } from "react-query";
import { FaTags } from "react-icons/fa";
import { IoIosHourglass } from "react-icons/io";
import { IoArrowRedoCircleOutline } from "react-icons/io5";
import {
  initScore,
  subListState,
  keyListState,
  subIdxSelector,
  keyIdxSelector,
  keyListSelector,
  keyIdxState,
  subIdxState,
} from "@recoils/quiz";
import { feedbackMsgList } from "@data/quiz";
import { useUserContext } from "@contexts/userContext";
import { getQuizRandom } from "@services/quiz.service";
import useQuizScore from "@hooks/useQuizScore";
import useQuizTimeout from "@hooks/useQuizTimeout";
import useQuizState from "@hooks/useQuizState";
import useQuizWrongList from "@hooks/useQuizWrongList";
import getDuration from "@utils/getDuration";
import Feedback from "@components/quiz/gameFeedback";
import Score from "@components/quiz/gameScore";
import { URLS } from "@/router";

const QuizGamePage = () => {
  const { catid: catId } = useParams();
  const navigate = useNavigate();
  const { userData } = useUserContext();
  const [userScore, setUserScore] = useState(initScore);
  const { data, isLoading } = useQuery(getQuizRandom({ catId }));
  const [subjectList, setSubjectList] = useRecoilState(subListState);
  const setKeywordList = useSetRecoilState(keyListState);
  const [keywordList, setNextList] = useRecoilState(keyListSelector);
  const [subIdx, setNextSubIdx] = useRecoilState(subIdxSelector);
  const [keyIdx, setNextKeyIdx] = useRecoilState(keyIdxSelector);
  const setFirstSubIdx = useResetRecoilState(subIdxState);
  const setFirstKeyIdx = useResetRecoilState(keyIdxState);
  const [feedbackMsg, setFeedbackMsg] = useState(feedbackMsgList.start);
  const [score, setScore] = useState(0);
  const { isLastSubject, isLastKeyword } = useQuizState();
  const [userAnswer, setUserAnswer] = useState("");
  const gameRef = useRef(null);
  const userAnswerRef = useRef(null);
  const msgInputRef = useRef(null);
  const { perfectScore, checkQuizAnswer } = useQuizScore();
  const { wrongAnswer, addWrongItem } = useQuizWrongList();
  const { countDown, setCounter, isCountStart } = useQuizTimeout({
    gameRef,
    userAnswerRef,
  });

  useEffect(() => {
    if (data) {
      setSubjectList([...data]);
      setKeywordList([...data[0].tbl_keywords]);
    }
    return () => {
      setFirstSubIdx();
      setFirstKeyIdx();
    };
  }, [data]);

  useEffect(() => {
    if (countDown < 0) {
      navigate(URLS.QUIZ_RESULT, {
        state: {
          wrongs: wrongAnswer,
          score: userScore,
        },
        replace: true,
      });
    }
  }, [countDown]);

  const resetAnswerInput = () => {
    setUserAnswer("");
    userAnswerRef.current.focus();
  };

  const navigateResult = ({ finalScore = score, jumped = false }) => {
    const duration = getDuration({
      date: userScore.sc_date,
      time: userScore.sc_time,
    });
    setUserScore((prev) => {
      return {
        ...prev,
        sc_category: subjectList[0].s_category,
        sc_catid: subjectList[0].s_catid,
        sc_score: finalScore,
        sc_totalscore: perfectScore,
        sc_duration: `${duration.HH}:${duration.mm}:${duration.ss}`,
        sc_userid: userData.u_userid,
      };
    });
    setCounter(jumped);
  };

  const onKeyDownHandler = (e) => {
    if (e.keyCode === 13) {
      if (userAnswer === "") return;
      let newScore = score;
      const isCorrect = checkQuizAnswer(userAnswer);
      if (isCorrect) {
        setFeedbackMsg(feedbackMsgList.correct);
        newScore += 5;
      }
      if (!isCorrect) {
        setFeedbackMsg(feedbackMsgList.wrong);
        addWrongItem({ state: "wrong", answer: userAnswer });
      }
      setScore(newScore);

      if (!isLastKeyword) {
        setNextKeyIdx();
      }
      if (isLastKeyword && !isLastSubject) {
        setNextSubIdx();
        setNextList();
        setFirstKeyIdx();
      }
      if (isLastKeyword && isLastSubject) {
        navigateResult({ finalScore: newScore });
      }

      resetAnswerInput();
    }
  };

  const skipSubjectHandler = () => {
    if (!isLastSubject) {
      setFeedbackMsg(feedbackMsgList.nextSub);
      setNextSubIdx();
      setNextList();
      setFirstKeyIdx();
    }
    if (isLastSubject) {
      navigateResult({ jumped: true });
    }
    addWrongItem({ state: "nextSub" });
    resetAnswerInput();
  };

  const skipKeywordHandler = () => {
    if (!isLastKeyword) {
      setFeedbackMsg(feedbackMsgList.nextKey);
      setNextKeyIdx();
    }
    if (!isLastSubject && isLastKeyword) {
      setFeedbackMsg(feedbackMsgList.nextSub);
      setNextSubIdx();
      setNextList();
      setFirstKeyIdx();
    }
    if (isLastSubject && isLastKeyword) {
      navigateResult({ jumped: true });
    }
    addWrongItem({ state: "nextKey" });
    resetAnswerInput();
  };

  if (isLoading) return null;
  return (
    <article className="Quiz">
      {!isCountStart ? (
        <div className="Game" ref={gameRef}>
          <Score score={score} perfectScore={perfectScore} />
          <div className="subject-box">
            <div className="category">{subjectList[subIdx]?.s_category}</div>
            <div>
              {subjectList?.length} 개의 주제 중 {subIdx + 1} 번째
            </div>
            <div className="subject">{subjectList[subIdx]?.s_subject}</div>
            <button onClick={skipSubjectHandler}>
              <IoArrowRedoCircleOutline />
              주제 건너뛰기
            </button>
          </div>
          <Feedback feedbackMsg={feedbackMsg} />
          <div className="keyword-box">
            <button onClick={skipKeywordHandler}>
              <IoArrowRedoCircleOutline />
              키워드 건너뛰기
            </button>
            <div className="keycount">
              <FaTags /> {keyIdx + 1} / {subjectList[subIdx]?.s_keycount}
            </div>
            <div className="keyword-desc">{keywordList[keyIdx]?.k_desc}</div>
          </div>
          <section className="answer-box">
            <div className="msg-box" ref={msgInputRef}>
              <input
                className="msg"
                ref={userAnswerRef}
                placeholder="정답을 입력하세요!"
                value={userAnswer}
                onChange={({ target: { value } }) => setUserAnswer(value)}
                onKeyDown={onKeyDownHandler}
              />
            </div>
          </section>
        </div>
      ) : (
        <section className="loading">
          <IoIosHourglass />
          <span>점수 계산 중...</span>
        </section>
      )}
    </article>
  );
};

export default QuizGamePage;
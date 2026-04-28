import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// --- SOUND SYNTHESIS (WEB AUDIO API) ---
const playSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "correct") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === "buzzer") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else if (type === "pass") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
};

// --- DYNAMIC QUESTION GENERATORS ---
const generateTrigQuestions = (count, difficulty) => {
  const funcs = ["sin", "cos", "tan"];
  const easyAngles = [
    { a: "0", v: ["0", "1", "0"] },
    { a: "π/6", v: ["1/2", "√3/2", "1/√3"] },
    { a: "π/4", v: ["1/√2", "1/√2", "1"] },
    { a: "π/3", v: ["√3/2", "1/2", "√3"] },
    { a: "π/2", v: ["1", "0", "Undefined"] },
  ];
  const medAngles = [
    { a: "2π/3", v: ["√3/2", "-1/2", "-√3"] },
    { a: "3π/4", v: ["1/√2", "-1/√2", "-1"] },
    { a: "5π/6", v: ["1/2", "-√3/2", "-1/√3"] },
    { a: "π", v: ["0", "-1", "0"] },
  ];

  let pool = difficulty === "easy" ? easyAngles : medAngles;
  if (difficulty === "hard" || difficulty === "impossible")
    pool = [...easyAngles, ...medAngles];

  let qs = [];
  for (let i = 0; i < count; i++) {
    const fIdx = Math.floor(Math.random() * 3);
    const aIdx = Math.floor(Math.random() * pool.length);
    const ans = pool[aIdx].v[fIdx];

    let options = new Set([ans]);
    while (options.size < 4) {
      const wrongF = Math.floor(Math.random() * 3);
      const wrongA = Math.floor(Math.random() * pool.length);
      options.add(pool[wrongA].v[wrongF]);
    }

    qs.push({
      q: `What is the value of ${funcs[fIdx]}(${pool[aIdx].a})?`,
      options: Array.from(options),
      ans,
      concept: "Standard Angles & Values",
    });
  }
  return qs;
};

// --- STATIC QUESTION BANKS ---
const staticBanks = {
  class11Trig: {
    easy: [
      {
        q: "What is the period of the function sin(x)?",
        options: ["π", "2π", "π/2", "4π"],
        ans: "2π",
        concept: "Function Periodicity",
      },
      {
        q: "What is the period of the function tan(x)?",
        options: ["π", "2π", "π/2", "4π"],
        ans: "π",
        concept: "Function Periodicity",
      },
      {
        q: "Simplify: 1 - sin²(x)",
        options: ["sec²(x)", "tan²(x)", "cos²(x)", "cot²(x)"],
        ans: "cos²(x)",
        concept: "Pythagorean Identities",
      },
      {
        q: "What is sin(-x) equal to?",
        options: ["sin(x)", "cos(x)", "-sin(x)", "-cos(x)"],
        ans: "-sin(x)",
        concept: "Odd/Even Functions",
      },
      {
        q: "What is cos(-x) equal to?",
        options: ["sin(x)", "cos(x)", "-sin(x)", "-cos(x)"],
        ans: "cos(x)",
        concept: "Odd/Even Functions",
      },
    ],
    medium: [
      {
        q: "Which formula represents sin(2θ)?",
        options: [
          "2sin(θ)cos(θ)",
          "cos²(θ) - sin²(θ)",
          "1 - 2sin²(θ)",
          "2tan(θ)/(1-tan²(θ))",
        ],
        ans: "2sin(θ)cos(θ)",
        concept: "Double Angle Formulas",
      },
      {
        q: "Which formula represents cos(2θ)?",
        options: [
          "2sin(θ)cos(θ)",
          "cos²(θ) - sin²(θ)",
          "1 + tan²(θ)",
          "2sin²(θ) - 1",
        ],
        ans: "cos²(θ) - sin²(θ)",
        concept: "Double Angle Formulas",
      },
      {
        q: "In which quadrant is both sin(x) < 0 and cos(x) < 0?",
        options: ["I", "II", "III", "IV"],
        ans: "III",
        concept: "Quadrants & Signs",
      },
      {
        q: "Evaluate sec²(x) - tan²(x)",
        options: ["-1", "0", "1", "undefined"],
        ans: "1",
        concept: "Pythagorean Identities",
      },
    ],
    hard: [
      {
        q: "What is the value of sin(75°)?",
        options: ["(√6 + √2)/4", "(√6 - √2)/4", "(√3 + 1)/2√2", "1/2"],
        ans: "(√6 + √2)/4",
        concept: "Compound Angles",
      },
      {
        q: "What is the maximum value of 3sin(x) + 4cos(x)?",
        options: ["7", "5", "12", "1"],
        ans: "5",
        concept: "Function Extremes",
      },
      {
        q: "What is the value of sin(18°)?",
        options: ["(√5 - 1)/4", "(√5 + 1)/4", "√10/4", "1/4"],
        ans: "(√5 - 1)/4",
        concept: "Special Angle Ratios",
      },
      {
        q: "Evaluate: cos(15°)",
        options: ["(√6 + √2)/4", "(√6 - √2)/4", "√3/2", "1/2"],
        ans: "(√6 + √2)/4",
        concept: "Compound Angles",
      },
    ],
    impossible: [
      {
        q: "Solve: sin(x) + sin(3x) + sin(5x) = 0 for general x.",
        options: ["nπ, nπ/3", "nπ/3", "2nπ", "None"],
        ans: "nπ/3",
        concept: "Trigonometric Equations",
      },
      {
        q: "What is the value of cos(36°)?",
        options: ["(√5 + 1)/4", "(√5 - 1)/4", "√10/4", "1/4"],
        ans: "(√5 + 1)/4",
        concept: "Special Angle Ratios",
      },
      {
        q: "Simplify: cos(20°)cos(40°)cos(80°)",
        options: ["1/8", "1/4", "1/2", "1"],
        ans: "1/8",
        concept: "Product to Sum Formulas",
      },
    ],
  },
  class12InvTrig: {
    easy: [
      {
        q: "What is the principal value branch of sin⁻¹(x)?",
        options: ["[0, π]", "(-π/2, π/2)", "[-π/2, π/2]", "(0, π)"],
        ans: "[-π/2, π/2]",
        concept: "Principal Value Branches",
      },
      {
        q: "What is the principal value branch of cos⁻¹(x)?",
        options: ["[0, π]", "[-π/2, π/2]", "(0, π)", "R"],
        ans: "[0, π]",
        concept: "Principal Value Branches",
      },
      {
        q: "What is the domain of sin⁻¹(x)?",
        options: ["R", "[-1, 1]", "(-1, 1)", "[0, 1]"],
        ans: "[-1, 1]",
        concept: "Domain & Range",
      },
      {
        q: "What is the value of tan⁻¹(1)?",
        options: ["π/6", "π/4", "π/3", "π/2"],
        ans: "π/4",
        concept: "Basic Inverse Evaluation",
      },
    ],
    medium: [
      {
        q: "Evaluate: sin⁻¹(-1/2)",
        options: ["-π/6", "5π/6", "11π/6", "-π/3"],
        ans: "-π/6",
        concept: "Inverse of Negative Arguments",
      },
      {
        q: "Evaluate: cos⁻¹(-1/2)",
        options: ["-π/3", "2π/3", "5π/6", "π/3"],
        ans: "2π/3",
        concept: "Inverse of Negative Arguments",
      },
      {
        q: "What is the value of sin⁻¹(x) + cos⁻¹(x)?",
        options: ["π", "π/2", "0", "2π"],
        ans: "π/2",
        concept: "Complementary Properties",
      },
      {
        q: "What is the value of tan⁻¹(x) + cot⁻¹(x)?",
        options: ["π", "π/2", "0", "2π"],
        ans: "π/2",
        concept: "Complementary Properties",
      },
    ],
    hard: [
      {
        q: "What does 2tan⁻¹(x) equal in terms of sin⁻¹?",
        options: [
          "sin⁻¹(2x / (1+x²))",
          "sin⁻¹(2x / (1-x²))",
          "sin⁻¹(x / (1+x²))",
          "sin⁻¹((1-x²) / (1+x²))",
        ],
        ans: "sin⁻¹(2x / (1+x²))",
        concept: "Multiple Angle Properties",
      },
      {
        q: "What does 2tan⁻¹(x) equal in terms of cos⁻¹?",
        options: [
          "cos⁻¹((1-x²) / (1+x²))",
          "cos⁻¹(2x / (1+x²))",
          "cos⁻¹((x²-1) / (x²+1))",
          "cos⁻¹(1 / x²)",
        ],
        ans: "cos⁻¹((1-x²) / (1+x²))",
        concept: "Multiple Angle Properties",
      },
      {
        q: "Evaluate tan⁻¹(1) + tan⁻¹(2) + tan⁻¹(3)",
        options: ["π", "π/2", "0", "3π/2"],
        ans: "π",
        concept: "Addition Formulas",
      },
      {
        q: "What is the value of sin(sin⁻¹(0.5))?",
        options: ["0.5", "π/6", "1", "0"],
        ans: "0.5",
        concept: "Self-Composition Properties",
      },
    ],
    impossible: [
      {
        q: "Evaluate: sin⁻¹(sin(2π/3))",
        options: ["2π/3", "π/3", "-π/3", "4π/3"],
        ans: "π/3",
        concept: "Advanced Composition",
      },
      {
        q: "Evaluate: cos⁻¹(cos(7π/6))",
        options: ["7π/6", "-π/6", "5π/6", "π/6"],
        ans: "5π/6",
        concept: "Advanced Composition",
      },
      {
        q: "Simplify tan⁻¹(x) + tan⁻¹(y) where xy < 1",
        options: [
          "tan⁻¹((x+y)/(1-xy))",
          "tan⁻¹((x-y)/(1+xy))",
          "π + tan⁻¹((x+y)/(1-xy))",
          "π/2",
        ],
        ans: "tan⁻¹((x+y)/(1-xy))",
        concept: "Addition Formulas",
      },
    ],
  },
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// --- COMPONENTS ---
const Confetti = () => {
  return (
    <>
      <style>
        {`
          .confetti-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; overflow: hidden; }
          .confetti { position: absolute; width: 10px; height: 10px; background-color: #f00; opacity: 0; animation: fall linear infinite; }
          @keyframes fall {
            0% { opacity: 1; transform: translateY(-10vh) rotate(0deg); }
            100% { opacity: 1; transform: translateY(110vh) rotate(720deg); }
          }
          .c1 { left: 10%; background-color: #ff3b3b; animation-duration: 2.5s; animation-delay: 0s; }
          .c2 { left: 20%; background-color: #3b82f6; animation-duration: 3s; animation-delay: 0.2s; }
          .c3 { left: 30%; background-color: #10b981; animation-duration: 2.2s; animation-delay: 0.5s; }
          .c4 { left: 40%; background-color: #f59e0b; animation-duration: 3.5s; animation-delay: 0.1s; }
          .c5 { left: 50%; background-color: #8b5cf6; animation-duration: 2.8s; animation-delay: 0.7s; }
          .c6 { left: 60%; background-color: #ec4899; animation-duration: 2.4s; animation-delay: 0.3s; }
          .c7 { left: 70%; background-color: #14b8a6; animation-duration: 3.2s; animation-delay: 0.6s; }
          .c8 { left: 80%; background-color: #f43f5e; animation-duration: 2.6s; animation-delay: 0.4s; }
          .c9 { left: 90%; background-color: #eab308; animation-duration: 2.9s; animation-delay: 0.8s; }
        `}
      </style>
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`confetti c${(i % 9) + 1}`}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default function App() {
  const [gameState, setGameState] = useState("lobby");
  const [questionsA, setQuestionsA] = useState([]);
  const [questionsB, setQuestionsB] = useState([]);
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");

  // Customization State
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  const GAP_TO_WIN = 20;

  // Scoring & Index State
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [teamAIndex, setTeamAIndex] = useState(0);
  const [teamBIndex, setTeamBIndex] = useState(0);

  // Detailed Stats Tracking
  const [statsA, setStatsA] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
  });
  const [statsB, setStatsB] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
    totalTime: 0,
  });

  // Time Tracking Refs (For exact millisecond precision without re-renders)
  const startTimeA = useRef(0);
  const startTimeB = useRef(0);

  // Concept Analytics Tracker
  const [missedA, setMissedA] = useState({});
  const [missedB, setMissedB] = useState({});

  const [feedbackA, setFeedbackA] = useState(null);
  const [feedbackB, setFeedbackB] = useState(null);

  useEffect(() => {
    if (gameState === "playing") {
      const diff = teamBScore - teamAScore;
      if (diff <= -GAP_TO_WIN || diff >= GAP_TO_WIN) {
        setTimeout(() => setGameState("gameover"), 1500);
      }
    }
  }, [teamAScore, teamBScore, gameState]);

  const assembleBank = (topic, diff) => {
    let pool = [];
    const dynamicQs = generateTrigQuestions(50, diff);
    if (topic === "integrated") {
      pool = [
        ...staticBanks.class11Trig[diff],
        ...staticBanks.class12InvTrig[diff],
        ...dynamicQs,
      ];
    } else {
      pool = [...staticBanks[topic][diff], ...dynamicQs];
    }
    pool = pool.map((q) => ({ ...q, options: shuffleArray([...q.options]) }));
    return shuffleArray(pool);
  };

  const startTopic = (topicName) => {
    const fullShuffledBank = assembleBank(topicName, difficulty);
    const half = Math.floor(fullShuffledBank.length / 2);
    setQuestionsA(fullShuffledBank.slice(0, half));
    setQuestionsB(fullShuffledBank.slice(half));

    resetGameState();
  };

  const handleManualParse = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (
        !Array.isArray(parsed) ||
        !parsed[0].q ||
        !parsed[0].options ||
        !parsed[0].ans
      ) {
        throw new Error(
          "Invalid format. Must be an array of {q, options, ans} objects."
        );
      }
      setError("");
      const processed = parsed.map((q) => ({
        ...q,
        concept: q.concept || "Custom Data",
        options: shuffleArray([...q.options]),
      }));
      const shuffled = shuffleArray(processed);
      const half = Math.floor(shuffled.length / 2);
      setQuestionsA(shuffled.slice(0, half));
      setQuestionsB(shuffled.slice(half));

      resetGameState();
    } catch (e) {
      setError(e.message);
    }
  };

  const resetGameState = () => {
    setTeamAScore(0);
    setTeamBScore(0);
    setTeamAIndex(0);
    setTeamBIndex(0);
    setStatsA({ correct: 0, incorrect: 0, skipped: 0, totalTime: 0 });
    setStatsB({ correct: 0, incorrect: 0, skipped: 0, totalTime: 0 });
    setMissedA({});
    setMissedB({});
    setFeedbackA(null);
    setFeedbackB(null);
    setGameState("playing");

    // Start timers
    const now = Date.now();
    startTimeA.current = now;
    startTimeB.current = now;
  };

  const handleAnswer = (team, selectedOption) => {
    if (Math.abs(teamBScore - teamAScore) >= GAP_TO_WIN) return;

    const isTeamA = team === "A";
    if (isTeamA && feedbackA) return;
    if (!isTeamA && feedbackB) return;

    // Calculate time taken for this exact question
    const timeTaken =
      Date.now() - (isTeamA ? startTimeA.current : startTimeB.current);

    const bank = isTeamA ? questionsA : questionsB;
    const currentIndex = isTeamA ? teamAIndex : teamBIndex;
    const currentQ = bank[currentIndex % bank.length];

    const isPass = selectedOption === null;
    const isCorrect = !isPass && selectedOption === currentQ.ans;

    // Update Scores and Stats Objects
    if (isCorrect) {
      playSound("correct");
      if (isTeamA) {
        setTeamAScore((prev) => prev + 4);
        setStatsA((prev) => ({
          ...prev,
          correct: prev.correct + 1,
          totalTime: prev.totalTime + timeTaken,
        }));
      } else {
        setTeamBScore((prev) => prev + 4);
        setStatsB((prev) => ({
          ...prev,
          correct: prev.correct + 1,
          totalTime: prev.totalTime + timeTaken,
        }));
      }
    } else {
      if (isPass) {
        playSound("pass");
        if (isTeamA)
          setStatsA((prev) => ({
            ...prev,
            skipped: prev.skipped + 1,
            totalTime: prev.totalTime + timeTaken,
          }));
        else
          setStatsB((prev) => ({
            ...prev,
            skipped: prev.skipped + 1,
            totalTime: prev.totalTime + timeTaken,
          }));
      } else {
        playSound("buzzer");
        if (isTeamA) {
          setTeamAScore((prev) => prev - 1);
          setStatsA((prev) => ({
            ...prev,
            incorrect: prev.incorrect + 1,
            totalTime: prev.totalTime + timeTaken,
          }));
        } else {
          setTeamBScore((prev) => prev - 1);
          setStatsB((prev) => ({
            ...prev,
            incorrect: prev.incorrect + 1,
            totalTime: prev.totalTime + timeTaken,
          }));
        }
      }

      // Record missed concept
      const concept = currentQ.concept || "General Topic";
      if (isTeamA)
        setMissedA((prev) => ({
          ...prev,
          [concept]: (prev[concept] || 0) + 1,
        }));
      else
        setMissedB((prev) => ({
          ...prev,
          [concept]: (prev[concept] || 0) + 1,
        }));
    }

    const feedbackObj = {
      status: isCorrect ? "correct" : isPass ? "pass" : "wrong",
      correctAns: currentQ.ans,
      selectedOpt: selectedOption,
    };

    if (isTeamA) setFeedbackA(feedbackObj);
    else setFeedbackB(feedbackObj);

    // Wait 2s for feedback, then load next question and reset that team's timer
    setTimeout(() => {
      if (isTeamA) {
        setFeedbackA(null);
        setTeamAIndex((prev) => prev + 1);
        startTimeA.current = Date.now();
      } else {
        setFeedbackB(null);
        setTeamBIndex((prev) => prev + 1);
        startTimeB.current = Date.now();
      }
    }, 2000);
  };

  const nameA = teamAName.trim() || "Red Team";
  const nameB = teamBName.trim() || "Blue Team";

  if (gameState === "lobby") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 overflow-y-auto relative">
        <div className="absolute top-4 left-0 w-full text-center">
          <p className="text-gray-500 font-mono text-sm tracking-widest uppercase">
            Created with ❤️ by Naitik Dalal
          </p>
        </div>

        <h1 className="text-5xl md:text-6xl font-black mt-10 mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-center tracking-tight">
          Math Tug of War
        </h1>
        <p className="text-gray-400 mb-8 text-md text-center max-w-xl">
          Correct: <span className="text-green-400 font-bold">+4</span> | Wrong:{" "}
          <span className="text-red-400 font-bold">-1</span> | Skip:{" "}
          <span className="text-gray-400 font-bold">0</span>
          <br />
          Pull the rope {GAP_TO_WIN} points into your zone to win!
        </p>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-red-400 font-bold mb-2 uppercase text-sm tracking-wider">
                Team 1 Name
              </label>
              <input
                type="text"
                placeholder="Red Team"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full p-3 bg-gray-900 border-2 border-red-900/50 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-blue-400 font-bold mb-2 uppercase text-sm tracking-wider">
                Team 2 Name
              </label>
              <input
                type="text"
                placeholder="Blue Team"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full p-3 bg-gray-900 border-2 border-blue-900/50 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <hr className="border-gray-700 my-6" />

          <div className="mb-8">
            <h3 className="text-center text-white font-bold mb-4 uppercase tracking-wider">
              Select Difficulty
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {["easy", "medium", "hard", "impossible"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-6 py-2 rounded-full font-bold uppercase tracking-wider transition ${
                    difficulty === level
                      ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)]"
                      : "bg-gray-900 text-gray-500 border border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-4 text-white text-center">
            Start Game
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => startTopic("class11Trig")}
              className="w-full py-4 text-lg bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl font-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition transform hover:scale-105 active:scale-95"
            >
              📐 Class 11
              <br />
              Trigonometry
            </button>
            <button
              onClick={() => startTopic("class12InvTrig")}
              className="w-full py-4 text-lg bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl font-black shadow-[0_0_20px_rgba(59,130,246,0.3)] transition transform hover:scale-105 active:scale-95"
            >
              🔄 Class 12
              <br />
              Inverse Trig
            </button>
            <button
              onClick={() => startTopic("integrated")}
              className="w-full py-4 text-lg bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] transition transform hover:scale-105 active:scale-95"
            >
              🔥 Integrated
              <br />
              (11 & 12)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    const isTeamAWin = teamAScore > teamBScore;
    const winner = isTeamAWin ? nameA : nameB;
    const winnerColor = isTeamAWin ? "text-red-500" : "text-blue-500";
    const pointsDifference = Math.abs(teamAScore - teamBScore);

    // Generate Analytics for the losing team
    const loserName = isTeamAWin ? nameB : nameA;
    const loserMissed = isTeamAWin ? missedB : missedA;
    const topMisses = Object.entries(loserMissed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Calculate display stats
    const totalA = statsA.correct + statsA.incorrect + statsA.skipped;
    const totalB = statsB.correct + statsB.incorrect + statsB.skipped;

    const accA = totalA ? Math.round((statsA.correct / totalA) * 100) : 0;
    const accB = totalB ? Math.round((statsB.correct / totalB) * 100) : 0;

    const avgA = totalA ? (statsA.totalTime / totalA / 1000).toFixed(1) : 0;
    const avgB = totalB ? (statsB.totalTime / totalB / 1000).toFixed(1) : 0;

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start relative overflow-y-auto pt-16 pb-24 px-4">
        <Confetti />

        {/* Victory Header */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-center z-10 mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-black text-white mb-2 shadow-sm">
            VICTORY
          </h1>
          <h2 className={`text-5xl md:text-6xl font-bold mb-4 ${winnerColor}`}>
            {winner} WINS!
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 font-bold bg-gray-800/80 inline-block px-6 py-2 rounded-full border border-gray-700">
            Won by a margin of {pointsDifference} points
          </p>
        </motion.div>

        {/* Post-Match Stats Board */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 z-10 mb-8"
        >
          {/* Team A Stats */}
          <div className="bg-red-950/40 p-6 rounded-2xl border border-red-900/50">
            <h3 className="text-2xl font-black text-red-500 uppercase tracking-widest text-center mb-6">
              {nameA} Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Accuracy
                </p>
                <p className="text-3xl font-mono text-white">{accA}%</p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Avg Speed
                </p>
                <p className="text-3xl font-mono text-white">{avgA}s</p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Correct
                </p>
                <p className="text-3xl font-mono text-green-400">
                  {statsA.correct}
                </p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Wrong/Skip
                </p>
                <p className="text-3xl font-mono text-red-400">
                  {statsA.incorrect}{" "}
                  <span className="text-gray-500 text-lg">
                    / {statsA.skipped}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Team B Stats */}
          <div className="bg-blue-950/40 p-6 rounded-2xl border border-blue-900/50">
            <h3 className="text-2xl font-black text-blue-500 uppercase tracking-widest text-center mb-6">
              {nameB} Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Accuracy
                </p>
                <p className="text-3xl font-mono text-white">{accB}%</p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Avg Speed
                </p>
                <p className="text-3xl font-mono text-white">{avgB}s</p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Correct
                </p>
                <p className="text-3xl font-mono text-green-400">
                  {statsB.correct}
                </p>
              </div>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm font-bold uppercase">
                  Wrong/Skip
                </p>
                <p className="text-3xl font-mono text-red-400">
                  {statsB.incorrect}{" "}
                  <span className="text-gray-500 text-lg">
                    / {statsB.skipped}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Post-Match Analytics Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-4xl bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl p-8 z-10 mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl">📋</span>
            <h3 className="text-2xl font-black text-white uppercase tracking-wider">
              Coach's Post-Match Report
            </h3>
          </div>

          <p className="text-gray-300 text-lg text-center mb-6">
            Hard luck, <span className="font-bold text-white">{loserName}</span>
            . To pull the rope next time, hit the books and practice these
            specific concepts:
          </p>

          {topMisses.length > 0 ? (
            <div className="space-y-4">
              {topMisses.map(([concept, count], idx) => (
                <div
                  key={idx}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
                >
                  <span className="text-xl font-bold text-yellow-400">
                    {concept}
                  </span>
                  <span className="text-sm text-gray-500 font-bold uppercase">
                    {count} Errors/Skips
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 text-center">
              <span className="text-green-400 font-bold">
                Incredible! You made 0 mistakes, but the other team was just
                faster!
              </span>
            </div>
          )}
        </motion.div>

        <button
          onClick={() => setGameState("lobby")}
          className="px-10 py-5 bg-white text-gray-900 text-2xl font-black rounded-full hover:scale-110 transition transform shadow-[0_0_30px_rgba(255,255,255,0.4)] z-10"
        >
          Rematch
        </button>

        {/* GRATITUDE FOOTER */}
        <div className="absolute bottom-6 w-full text-center z-20">
          <p className="text-gray-500 font-mono text-sm font-bold tracking-widest uppercase">
            Special Thanks & CC: Naitik Dalal
          </p>
        </div>
      </div>
    );
  }

  const ropeDiff = teamBScore - teamAScore;
  const percentagePerPoint = 40 / GAP_TO_WIN;
  const markerPosition = Math.max(
    10,
    Math.min(90, 50 + ropeDiff * percentagePerPoint)
  );

  const activeQuestionA = questionsA[teamAIndex % questionsA.length];
  const activeQuestionB = questionsB[teamBIndex % questionsB.length];

  const getButtonClass = (opt, isTeamA) => {
    const feedback = isTeamA ? feedbackA : feedbackB;
    const defaultColor = isTeamA ? "red" : "blue";

    if (!feedback) {
      return `bg-${defaultColor}-900/40 hover:bg-${defaultColor}-600 active:bg-${defaultColor}-500 border border-${defaultColor}-800/50 hover:border-${defaultColor}-400 text-white`;
    }

    if (opt === feedback.correctAns) {
      return `bg-green-600 border border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)] z-10`;
    }

    if (feedback.status === "wrong" && opt === feedback.selectedOpt) {
      return `bg-red-700 border border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] z-10`;
    }

    return `bg-gray-800 border border-gray-700 text-gray-500 opacity-50`;
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* SCOREBOARD & ROPE */}
      <div className="w-full h-36 flex-shrink-0 bg-gray-800 shadow-2xl z-20 relative flex flex-col justify-center px-4 md:px-8 border-b-4 border-gray-950">
        <div className="flex justify-between items-center mb-3 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-start w-32 md:w-48 truncate">
            <span className="text-red-500 font-black text-xl md:text-2xl uppercase tracking-widest truncate w-full">
              {nameA}
            </span>
            <span className="text-3xl md:text-4xl font-mono font-bold">
              {teamAScore} <span className="text-sm text-gray-400">pts</span>
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
              Gap to Win: {GAP_TO_WIN}
            </span>
          </div>

          <div className="flex flex-col items-end w-32 md:w-48 truncate">
            <span className="text-blue-500 font-black text-xl md:text-2xl uppercase tracking-widest text-right truncate w-full">
              {nameB}
            </span>
            <span className="text-3xl md:text-4xl font-mono font-bold">
              {teamBScore} <span className="text-sm text-gray-400">pts</span>
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative h-10 flex items-center bg-gray-950 rounded-full border border-gray-700 px-4">
          <div className="w-full h-2 bg-yellow-700 rounded-full relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-1 bg-white opacity-20" />
            <motion.div
              className="absolute top-1/2 w-10 h-10 bg-white rounded-full border-4 border-gray-900 flex items-center justify-center -ml-5 -mt-5"
              style={{
                boxShadow:
                  ropeDiff < 0
                    ? "0 0 20px rgba(239,68,68,0.8)"
                    : ropeDiff > 0
                    ? "0 0 20px rgba(59,130,246,0.8)"
                    : "0 0 10px rgba(255,255,255,0.5)",
              }}
              animate={{
                left: `${markerPosition}%`,
                backgroundColor:
                  ropeDiff < 0
                    ? "#ef4444"
                    : ropeDiff > 0
                    ? "#3b82f6"
                    : "#ffffff",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
        </div>
      </div>

      {/* SPLIT SCREEN PLAY AREA */}
      <div className="flex-grow flex w-full h-[calc(100vh-9rem)]">
        {/* TEAM A (RED) */}
        <div className="w-1/2 h-full bg-gradient-to-br from-red-950 to-gray-900 border-r-4 border-gray-950 p-4 md:p-6 flex flex-col relative overflow-y-auto">
          <div className="absolute top-4 left-6 text-red-500/10 text-8xl font-black italic select-none pointer-events-none z-0">
            Q{teamAIndex + 1}
          </div>

          <div className="flex-grow flex flex-col max-w-xl mx-auto w-full z-10 pt-16 pb-24">
            <div className="flex justify-between items-center mb-6">
              <span className="text-red-400/80 font-bold text-xs md:text-sm tracking-widest uppercase hidden md:block">
                Current Question
              </span>
              <button
                disabled={!!feedbackA}
                onClick={() => handleAnswer("A", null)}
                className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition transform border ${
                  feedbackA
                    ? "bg-gray-800 border-gray-700 text-gray-600 opacity-50"
                    : "bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                }`}
              >
                ⏭️ Skip (0 Pts)
              </button>
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-red-100 mb-8 flex items-center">
              {activeQuestionA.q}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {activeQuestionA.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!feedbackA}
                  onClick={() => handleAnswer("A", opt)}
                  className={`w-full p-4 text-md md:text-lg font-semibold rounded-xl transition transform relative ${getButtonClass(
                    opt,
                    true
                  )}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TEAM B (BLUE) */}
        <div className="w-1/2 h-full bg-gradient-to-bl from-blue-950 to-gray-900 p-4 md:p-6 flex flex-col relative overflow-y-auto">
          <div className="absolute top-4 right-6 text-blue-500/10 text-8xl font-black italic select-none pointer-events-none z-0">
            Q{teamBIndex + 1}
          </div>

          <div className="flex-grow flex flex-col max-w-xl mx-auto w-full z-10 pt-16 pb-24">
            <div className="flex justify-between items-center mb-6">
              <span className="text-blue-400/80 font-bold text-xs md:text-sm tracking-widest uppercase hidden md:block">
                Current Question
              </span>
              <button
                disabled={!!feedbackB}
                onClick={() => handleAnswer("B", null)}
                className={`px-3 py-2 text-xs md:text-sm font-bold rounded-lg transition transform border ${
                  feedbackB
                    ? "bg-gray-800 border-gray-700 text-gray-600 opacity-50"
                    : "bg-gray-800/80 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                }`}
              >
                ⏭️ Skip (0 Pts)
              </button>
            </div>

            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-blue-100 mb-8 flex items-center">
              {activeQuestionB.q}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {activeQuestionB.options.map((opt, i) => (
                <button
                  key={i}
                  disabled={!!feedbackB}
                  onClick={() => handleAnswer("B", opt)}
                  className={`w-full p-4 text-md md:text-lg font-semibold rounded-xl transition transform relative ${getButtonClass(
                    opt,
                    false
                  )}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

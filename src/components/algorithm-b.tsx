import { cn } from "@/lib/cn";
import { flushSync } from "react-dom";
import { useRef, useState } from "react";
import { random } from "@/lib/random";
import Button from "./shared/button";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Flip } from "gsap/all";

interface Letter {
  id: string;
  letter: string;
  isSaved: boolean;
}

const generateLetters = (repeat: number, alphabet: string[]): Letter[] => {
  return alphabet.flatMap((char, charIndex) =>
    Array.from({ length: repeat }, (_, i) => ({
      id: `letter-${charIndex * repeat + i}`,
      letter: char,
      isSaved: false,
    })),
  );
};

const AlgorithmB = () => {
  const containerRef = useRef<HTMLElement>(null!);
  const [alphabet, setAlphabet] = useState("ABC".split(""));
  const [repeat, setRepeat] = useState(3);
  const [letters, setLetters] = useState(() =>
    generateLetters(repeat, alphabet),
  );
  const [isAnimating, setIsAnimating] = useState(false);

  useGSAP(
    () => {
      gsap.registerPlugin(Flip);
    },
    { scope: containerRef },
  );

  const getSavedCount = (letter: string) =>
    letters.filter((l) => l.letter === letter && l.isSaved).length;

  const animateLetterMovement = (
    sourceSelector: string,
    targetSelector: string,
    letterText: string,
    onComplete: () => void,
  ) => {
    const sourceElement = document.querySelector(sourceSelector);
    const targetElement = document.querySelector(targetSelector);

    if (!sourceElement || !targetElement) {
      onComplete();
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const tempElement = document.createElement("div");
    tempElement.className =
      "flex items-center justify-center absolute pointer-events-none";
    tempElement.style.left = `${sourceRect.left}px`;
    tempElement.style.top = `${sourceRect.top}px`;
    tempElement.innerHTML = `<p class="text-neutral-50 rounded-sm px-4 py-2">${letterText}</p>`;
    document.body.appendChild(tempElement);

    gsap.to(tempElement, {
      x: targetRect.left - sourceRect.left - 15,
      y: targetRect.top - sourceRect.top - 8,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        document.body.removeChild(tempElement);
        onComplete();
      },
    });
  };

  const saveLetter = () => {
    if (isAnimating) return;

    const unsavedLetters = letters.filter((l) => !l.isSaved);
    if (unsavedLetters.length === 0) return;

    setIsAnimating(true);

    const selectedLetter =
      unsavedLetters[Math.floor(random() * unsavedLetters.length)];

    animateLetterMovement(
      `.letter-${selectedLetter.id}`,
      `.save-position-${selectedLetter.letter}`,
      selectedLetter.letter,
      () => {
        const containerState = Flip.getState(containerRef.current);

        setTimeout(() => {
          flushSync(() => {
            setLetters((prev) =>
              prev.map((item) =>
                item.id === selectedLetter.id
                  ? { ...item, isSaved: true }
                  : item,
              ),
            );
          });

          Flip.from(containerState, {
            duration: 0.3,
            ease: "power1.inOut",
            simple: true,
            onComplete: () => setIsAnimating(false),
          });
        }, 50);
      },
    );
  };

  const resetLetters = () => {
    const savedLetters = letters.filter((l) => l.isSaved);

    savedLetters.forEach((letterData, index) => {
      const sourceElement = document.querySelector(
        `.save-position-${letterData.letter}`,
      );
      if (!sourceElement) return;

      const sourceRect = sourceElement.getBoundingClientRect();
      const tempElement = document.createElement("div");
      tempElement.className =
        "flex items-center justify-center absolute pointer-events-none";
      tempElement.style.left = `${sourceRect.left - 15}px`;
      tempElement.style.top = `${sourceRect.top - 8}px`;
      tempElement.innerHTML = `<p class="text-neutral-50 rounded-sm px-4 py-2">${letterData.letter}</p>`;
      document.body.appendChild(tempElement);

      gsap.to(tempElement, {
        y: -50,
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        delay: index * 0.05,
        onComplete: () => {
          document.body.removeChild(tempElement);
        },
      });
    });

    setTimeout(
      () => {
        const containerState = Flip.getState(containerRef.current);

        flushSync(() => {
          setLetters((prev) =>
            prev.map((item) => ({ ...item, isSaved: false })),
          );
        });

        Flip.from(containerState, {
          duration: 0.3,
          ease: "power1.inOut",
          simple: true,
        });
      },
      600 + savedLetters.length * 50,
    );
  };

  const changeAlphabet = (newAlphabet: string[]) => {
    const state = Flip.getState("[class*='letter-']");
    const containerState = Flip.getState(containerRef.current);

    flushSync(() => {
      setAlphabet(newAlphabet);
      setLetters((prevLetters) => {
        const savedByLetter = prevLetters
          .filter((l) => l.isSaved && newAlphabet.includes(l.letter))
          .reduce(
            (acc, l) => {
              acc[l.letter] = (acc[l.letter] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

        const newLetters = generateLetters(repeat, newAlphabet);
        const savedCountByLetter: Record<string, number> = {};

        return newLetters.map((newLetter) => {
          const savedCount = savedByLetter[newLetter.letter] || 0;
          savedCountByLetter[newLetter.letter] =
            savedCountByLetter[newLetter.letter] || 0;

          if (savedCountByLetter[newLetter.letter] < savedCount) {
            savedCountByLetter[newLetter.letter]++;
            return { ...newLetter, isSaved: true };
          }
          return newLetter;
        });
      });
    });

    Flip.from(containerState, {
      duration: 0.5,
      ease: "power1.inOut",
      simple: true,
    });
    Flip.from(state, {
      duration: 0.3,
      ease: "power1.inOut",
      stagger: 0.01,
      simple: true,
    });
  };

  const changeRepeat = (newRepeat: number) => {
    const state = Flip.getState("[class*='letter-']");
    const clampedRepeat = Math.max(1, Math.min(10, newRepeat));

    flushSync(() => {
      setRepeat(clampedRepeat);
      setLetters(generateLetters(clampedRepeat, alphabet));
    });

    Flip.from(state, {
      duration: 0.3,
      ease: "power1.inOut",
      stagger: 0.01,
      simple: true,
    });
  };

  return (
    <section
      className="flex flex-col sm:gap-4 gap-6 bg-neutral-800 p-4 rounded-sm"
      ref={containerRef}
    >
      <h1 className="sm:text-3xl text-2xl font-bold text-center">
        Algoritmo B
      </h1>

      <article className="w-full flex justify-center gap-4 flex-wrap">
        <label className="flex items-center gap-2">
          <span className="text-neutral-50">Alfabeto:</span>
          <input
            type="text"
            value={alphabet.join("")}
            onChange={(e) => {
              const inputData = (e.nativeEvent as InputEvent).data || "";
              if (alphabet.includes(inputData) || inputData === " ") return;
              changeAlphabet(e.target.value.split(""));
            }}
            className="px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-sm text-neutral-300 hover:border-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors w-20"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-neutral-50">Repeticiones:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => changeRepeat(repeat - 1)}
              disabled={repeat <= 1}
            >
              -
            </Button>
            {repeat}
            <Button
              variant="ghost"
              onClick={() => changeRepeat(repeat + 1)}
              disabled={repeat >= 10}
            >
              +
            </Button>
          </div>
        </label>
      </article>

      <article className="w-full flex justify-center gap-4 flex-wrap">
        <Button
          onClick={saveLetter}
          variant="primary"
          disabled={letters.every((l) => l.isSaved) || isAnimating}
        >
          Guardar Letra Aleatoria
        </Button>
        <Button variant="ghost" onClick={resetLetters}>
          Reiniciar Letras
        </Button>
      </article>

      <article className="unsaved-letters-container w-full flex flex-wrap justify-center gap-4 bg-neutral-900 p-4 rounded-md min-h-0">
        {letters
          .filter((l) => !l.isSaved)
          .map(({ id, letter }) => (
            <div
              key={id}
              className={cn(
                "flex items-center justify-center",
                `container-${id}`,
              )}
            >
              <p
                className={cn(
                  "text-neutral-50 rounded-sm px-4 py-2",
                  `letter-${id}`,
                )}
              >
                {letter}
              </p>
            </div>
          ))}
      </article>

      <article className="w-full flex justify-center gap-4">
        {alphabet.map((letter) => (
          <div
            key={letter}
            className="flex items-center justify-center flex-col bg-neutral-900 gap-2 p-4 rounded-md w-full"
          >
            <p className={cn("text-neutral-50", `save-position-${letter}`)}>
              {letter}
            </p>
            <p className="text-neutral-50">{getSavedCount(letter)}</p>
          </div>
        ))}
      </article>
    </section>
  );
};

export default AlgorithmB;

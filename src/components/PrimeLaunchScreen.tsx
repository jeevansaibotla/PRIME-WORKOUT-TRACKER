type PrimeLaunchScreenProps = {
  exiting: boolean;
};

export function PrimeLaunchScreen({ exiting }: PrimeLaunchScreenProps) {
  return (
    <div
      className={`prime-launch-screen${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-label="PRIME Command startup"
      aria-hidden={exiting}
    >
      <img
        className="prime-launch-fiber-background"
        src={`${import.meta.env.BASE_URL}prime-splash-fiber-background.png`}
        alt=""
        aria-hidden="true"
      />
      <svg
        className="prime-launch-fibers"
        viewBox="0 0 800 1400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="prime-fiber-blue" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f4f0e6" stopOpacity="0" />
            <stop offset="0.48" stopColor="#246fe1" stopOpacity="0.58" />
            <stop offset="1" stopColor="#8ebaff" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="prime-fiber-copper" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f4f0e6" stopOpacity="0" />
            <stop offset="0.54" stopColor="#a75d47" stopOpacity="0.35" />
            <stop offset="1" stopColor="#d8a27e" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="prime-fiber-red" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f4f0e6" stopOpacity="0" />
            <stop offset="0.55" stopColor="#7d3438" stopOpacity="0.2" />
            <stop offset="1" stopColor="#c27b6b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" transform="translate(450 0)">
          <path
            d="M830 48C604 118 664 296 478 405S296 617 105 714"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="3"
          />
          <path
            d="M844 80C625 160 684 315 504 432S321 636 112 742"
            stroke="url(#prime-fiber-red)"
            strokeWidth="2"
          />
          <path
            d="M850 116C654 186 708 349 528 456S348 661 120 770"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2.5"
          />
          <path
            d="M855 158C677 224 730 380 551 483S375 686 130 797"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.5"
          />
          <path
            d="M864 204C705 261 754 410 576 511S401 713 143 826"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="1.4"
          />
          <path
            d="M872 252C732 300 777 440 601 542S430 741 156 854"
            stroke="url(#prime-fiber-red)"
            strokeWidth="2"
          />
          <path
            d="M876 300C760 340 800 474 627 576S459 770 171 884"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.2"
          />
          <path
            d="M884 352C786 386 821 506 653 609S490 801 186 913"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2"
          />
          <path
            d="M890 404C812 432 842 541 678 641S520 829 205 945"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.3"
          />
          <path
            d="M900 460C841 482 863 578 703 674S552 860 226 976"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="2"
          />
          <path
            d="M916 516C875 534 883 614 728 706S583 890 248 1007"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="1.5"
          />
          <path
            d="M930 574C908 588 904 650 754 739S615 919 275 1038"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.2"
          />
          <path
            d="M950 632C935 654 926 690 779 773S649 948 302 1068"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.5"
          />
          <path
            d="M970 694C953 717 950 735 805 808S681 981 331 1099"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2"
          />
          <path
            d="M987 754C967 778 974 779 831 843S715 1014 360 1130"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.2"
          />
          <path
            d="M1000 818C977 839 996 824 858 878S748 1048 392 1163"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.4"
          />
          <path
            d="M1010 884C984 903 1012 869 884 916S780 1080 427 1196"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2"
          />
          <path
            d="M1018 950C990 966 1030 913 909 956S812 1115 466 1232"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.1"
          />
          <path
            d="M1024 1016C995 1030 1047 957 934 997S846 1151 508 1270"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.5"
          />
          <path
            d="M1030 1080C1000 1093 1063 1000 958 1039S878 1190 551 1308"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2"
          />
          <path
            d="M1036 1146C1008 1158 1078 1045 981 1083S911 1230 594 1347"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.2"
          />
          <path
            d="M1040 1212C1014 1224 1092 1092 1005 1128S945 1272 637 1388"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.6"
          />
        </g>
        <g fill="none" strokeLinecap="round" opacity="0.76">
          <path
            d="M-80 1390C118 1260 269 1315 438 1380S748 1430 940 1280"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="2.2"
          />
          <path
            d="M-60 1420C145 1300 295 1350 464 1415S770 1455 970 1315"
            stroke="url(#prime-fiber-copper)"
            strokeWidth="1.5"
          />
          <path
            d="M-45 1450C165 1335 321 1380 490 1448S792 1485 995 1350"
            stroke="url(#prime-fiber-red)"
            strokeWidth="1.2"
          />
          <path
            d="M-30 1480C190 1370 344 1415 515 1480S818 1515 1020 1384"
            stroke="url(#prime-fiber-blue)"
            strokeWidth="1.8"
          />
        </g>
      </svg>
      <div className="prime-launch-glow" aria-hidden="true" />
      <div className="prime-launch-brand">
        <div className="prime-launch-emblem">
          <img
            src={`${import.meta.env.BASE_URL}prime-mark-reference.png`}
            alt=""
            width="262"
            height="206"
          />
        </div>
        <p className="prime-launch-wordmark">PRIME</p>
        <p className="prime-launch-command">COMMAND</p>
        <span className="prime-launch-divider" aria-hidden="true" />
        <p className="prime-launch-tagline">TRAIN WITH INTENT.</p>
        <p className="prime-launch-tagline prime-launch-tagline-secondary">
          LET THE WORK BECOME VISIBLE.
        </p>
      </div>
      <div className="prime-launch-credit">MADE WITH PASSION BY JEEVAN SAI KUMAR BOTLA</div>
    </div>
  );
}

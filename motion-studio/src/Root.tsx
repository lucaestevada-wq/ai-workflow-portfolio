import React from "react";
import { Composition } from "remotion";
import { CANVAS } from "./lib/house";
import { SystemCheck } from "./compositions/SystemCheck";
import { CollageProof } from "./compositions/CollageProof";
import { SpotifyEverySound as Spotify1, SPOTIFY_DURATION as SPOTIFY_DUR_1 } from "./compositions/SpotifyEverySound_1";
import { SpotifyEverySound as Spotify2, SPOTIFY_DURATION as SPOTIFY_DUR_2 } from "./compositions/SpotifyEverySound_2";
import { SpotifyEverySound as Spotify3, SPOTIFY_DURATION as SPOTIFY_DUR_3 } from "./compositions/SpotifyEverySound_3";
import { SpotifyEverySound as Spotify4, SPOTIFY_DURATION as SPOTIFY_DUR_4 } from "./compositions/SpotifyEverySound_4";
import { LiquidDeath as LiquidDeath1, LD_DURATION as LD_DUR_1 } from "./compositions/LiquidDeath_1";
import { LiquidDeath as LiquidDeath2, LD_DURATION as LD_DUR_2 } from "./compositions/LiquidDeath_2";
import { LiquidDeath as LiquidDeath3, LD_DURATION as LD_DUR_3 } from "./compositions/LiquidDeath_3";
import { LiquidDeath as LiquidDeath4, LD_DURATION as LD_DUR_4 } from "./compositions/LiquidDeath_4";
import { LiquidDeath as LiquidDeath5, LD_DURATION as LD_DUR_5 } from "./compositions/LiquidDeath_5";
import { LiquidDeath as LiquidDeath6, LD_DURATION as LD_DUR_6 } from "./compositions/LiquidDeath_6";
import { LiquidDeath as LiquidDeath7, LD_DURATION as LD_DUR_7 } from "./compositions/LiquidDeath_7";
import { LiquidDeath as LiquidDeath916_1, LD_DURATION as LD_DUR_916_1 } from "./compositions/LiquidDeath_916_1";
import { SpotifyEverySound as Spotify916_1, SPOTIFY_DURATION as SPOTIFY_DUR_916_1 } from "./compositions/SpotifyEverySound_916_1";
import { SpotifyEverySound as Spotify5, SPOTIFY_DURATION as SPOTIFY_DUR_5 } from "./compositions/SpotifyEverySound_5";
import { SpotifyEverySound as Spotify916_2, SPOTIFY_DURATION as SPOTIFY_DUR_916_2 } from "./compositions/SpotifyEverySound_916_2";
import { SpotifyEverySound as Spotify6, SPOTIFY_DURATION as SPOTIFY_DUR_6 } from "./compositions/SpotifyEverySound_6";
import { SpotifyEverySound as Spotify916_3, SPOTIFY_DURATION as SPOTIFY_DUR_916_3 } from "./compositions/SpotifyEverySound_916_3";
import { SpotifyEverySound as Spotify916_4, SPOTIFY_DURATION as SPOTIFY_DUR_916_4 } from "./compositions/SpotifyEverySound_916_4";
import { Revolut916 as Revolut916_1, RV_DURATION as RV_DUR_916_1 } from "./compositions/Revolut_916_1";
import { Revolut916 as Revolut916_2, RV_DURATION as RV_DUR_916_2 } from "./compositions/Revolut_916_2";
import { Revolut916 as Revolut916_3, RV_DURATION as RV_DUR_916_3 } from "./compositions/Revolut_916_3";
import { Revolut916 as Revolut916_4, RV_DURATION as RV_DUR_916_4 } from "./compositions/Revolut_916_4";
import { Revolut916 as Revolut916_5, RV_DURATION as RV_DUR_916_5 } from "./compositions/Revolut_916_5";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SystemCheck"
        component={SystemCheck}
        durationInFrames={150} // 5s @ 30fps
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
      />
      <Composition
        id="CollageProof"
        component={CollageProof}
        durationInFrames={240} // 8s @ 30fps (matches testbeat)
        fps={CANVAS.fps}
        width={CANVAS.width}
        height={CANVAS.height}
      />
      {/* VERSIONING: never overwrite. Each iteration = new file _N + new id -N + new render script. */}
      <Composition id="SpotifyEverySound-1" component={Spotify1} durationInFrames={SPOTIFY_DUR_1} fps={30} width={1920} height={1080} />
      <Composition id="SpotifyEverySound-2" component={Spotify2} durationInFrames={SPOTIFY_DUR_2} fps={30} width={1920} height={1080} />
      <Composition id="SpotifyEverySound-3" component={Spotify3} durationInFrames={SPOTIFY_DUR_3} fps={30} width={1920} height={1080} />
      <Composition id="SpotifyEverySound-4" component={Spotify4} durationInFrames={SPOTIFY_DUR_4} fps={30} width={1920} height={1080} />
      <Composition id="SpotifyEverySound-5" component={Spotify5} durationInFrames={SPOTIFY_DUR_5} fps={30} width={1920} height={1080} />
      <Composition id="SpotifyEverySound-6" component={Spotify6} durationInFrames={SPOTIFY_DUR_6} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-1" component={LiquidDeath1} durationInFrames={LD_DUR_1} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-2" component={LiquidDeath2} durationInFrames={LD_DUR_2} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-3" component={LiquidDeath3} durationInFrames={LD_DUR_3} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-4" component={LiquidDeath4} durationInFrames={LD_DUR_4} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-5" component={LiquidDeath5} durationInFrames={LD_DUR_5} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-6" component={LiquidDeath6} durationInFrames={LD_DUR_6} fps={30} width={1920} height={1080} />
      <Composition id="LiquidDeath-7" component={LiquidDeath7} durationInFrames={LD_DUR_7} fps={30} width={1920} height={1080} />
      {/* vertical 9:16 cuts (Instagram Reels) */}
      <Composition id="LiquidDeath-916-1" component={LiquidDeath916_1} durationInFrames={LD_DUR_916_1} fps={30} width={1080} height={1920} />
      <Composition id="SpotifyEverySound-916-1" component={Spotify916_1} durationInFrames={SPOTIFY_DUR_916_1} fps={30} width={1080} height={1920} />
      <Composition id="SpotifyEverySound-916-2" component={Spotify916_2} durationInFrames={SPOTIFY_DUR_916_2} fps={30} width={1080} height={1920} />
      <Composition id="SpotifyEverySound-916-3" component={Spotify916_3} durationInFrames={SPOTIFY_DUR_916_3} fps={30} width={1080} height={1920} />
      <Composition id="SpotifyEverySound-916-4" component={Spotify916_4} durationInFrames={SPOTIFY_DUR_916_4} fps={30} width={1080} height={1920} />
      {/* piece 3 — Revolut (9:16 native) */}
      <Composition id="Revolut-916-1" component={Revolut916_1} durationInFrames={RV_DUR_916_1} fps={30} width={1080} height={1920} />
      <Composition id="Revolut-916-2" component={Revolut916_2} durationInFrames={RV_DUR_916_2} fps={30} width={1080} height={1920} />
      <Composition id="Revolut-916-3" component={Revolut916_3} durationInFrames={RV_DUR_916_3} fps={30} width={1080} height={1920} />
      <Composition id="Revolut-916-4" component={Revolut916_4} durationInFrames={RV_DUR_916_4} fps={30} width={1080} height={1920} />
      <Composition id="Revolut-916-5" component={Revolut916_5} durationInFrames={RV_DUR_916_5} fps={30} width={1080} height={1920} />
      {/* Add new brand pieces here as separate <Composition> entries. */}
    </>
  );
};

import React from 'react';
import styled from 'styled-components';

const Loader = () => {
    return (
        <StyledWrapper>
            <div className="wrapper">
                <div className="circle" />
                <div className="circle" />
                <div className="circle" />
                <div className="shadow" />
                <div className="shadow" />
                <div className="shadow" />
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  .wrapper {
    width: 200px;
    height: 60px;
    position: relative;
    z-index: 1;
  }

  .circle {
    width: 20px;
    height: 20px;
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(45deg, #8a2be2, #a100ff);
    left: 15%;
    transform-origin: 50%;
    animation: circle7124 .5s alternate infinite ease;
    box-shadow: 0 0 10px rgba(138, 43, 226, 0.8);
  }

  @keyframes circle7124 {
    0% {
      top: 60px;
      height: 5px;
      border-radius: 50px 50px 25px 25px;
      transform: scaleX(1.7);
    }

    40% {
      height: 20px;
      border-radius: 50%;
      transform: scaleX(1);
    }

    100% {
      top: 0%;
    }
  }

  .circle:nth-child(2) {
    left: 45%;
    animation-delay: .2s;
    background: linear-gradient(45deg, #9d50ff, #ff00ff);
  }

  .circle:nth-child(3) {
    left: auto;
    right: 15%;
    animation-delay: .3s;
    background: linear-gradient(45deg, #6a00ff, #8a2be2);
  }

  .shadow {
    width: 20px;
    height: 4px;
    border-radius: 50%;
    background-color: rgba(106, 0, 255, 0.5);
    position: absolute;
    top: 62px;
    transform-origin: 50%;
    z-index: -1;
    left: 15%;
    filter: blur(1px);
    animation: shadow046 .5s alternate infinite ease;
  }

  @keyframes shadow046 {
    0% {
      transform: scaleX(1.5);
    }

    40% {
      transform: scaleX(1);
      opacity: .7;
    }

    100% {
      transform: scaleX(.2);
      opacity: .4;
    }
  }

  .shadow:nth-child(4) {
    left: 45%;
    animation-delay: .2s;
    background-color: rgba(157, 80, 255, 0.5);
  }

  .shadow:nth-child(5) {
    left: auto;
    right: 15%;
    animation-delay: .3s;
    background-color: rgba(138, 43, 226, 0.5);
  }`;

export default Loader;
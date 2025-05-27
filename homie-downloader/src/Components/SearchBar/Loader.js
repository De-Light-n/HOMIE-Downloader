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
    background: var(--primary-color);
    left: 15%;
    transform-origin: 50%;
    animation: circle7124 .5s alternate infinite ease;
    box-shadow: 0 0 10px var(--primary-color);
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
    background: var(--text-secondary);
  }

  .circle:nth-child(3) {
    left: auto;
    right: 15%;
    animation-delay: .3s;
    background: var(--primary-dark);
  }

  .shadow {
    width: 20px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--border-color);
    position: absolute;
    top: 62px;
    transform-origin: 50%;
    z-index: -1;
    left: 15%;
    filter: blur(1px);
    animation: shadow046 .5s alternate infinite ease;
    opacity: 0.5;
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
  }

  .shadow:nth-child(5) {
    left: auto;
    right: 15%;
    animation-delay: .3s;
  }
`;

export default Loader;
import React, { useState } from 'react';
import { FaBook } from 'react-icons/fa';
import { FaMoon } from 'react-icons/fa';
import { FaSun } from 'react-icons/fa';
import './Navbar.scss';

const Navbar = ({ onClick, getCurrentFont, currentFont }) => {
  const [active, setActive] = useState(false);
  
  const clickHandler = () => {
    onClick();
    setActive(!active);
  }
  return (
    <nav className='navbar'>
      <FaBook className='book-icon' />
      <div className="style-togglers">
        <select name="font" id="font-select" defaultValue={currentFont} onChange={(e) => getCurrentFont(e.target.value)}>
          <option value="Roboto Slab">serif</option>
          <option value="Poppins">sans-serif</option>
          <option value="Roboto Mono">monospace</option>
          <option value="Gruppo">display</option>
          <option value="Charm">handwriting</option>
        </select>
        <div className="switch" onClick={clickHandler}><div className={active ? 'toggle-btn active' : 'toggle-btn'}></div></div>
        {!active? <FaSun/> : <FaMoon/>}
      </div>
    </nav>
  )
}

export default Navbar;

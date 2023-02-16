import React, { useState } from 'react';
import { FaBook } from 'react-icons/fa';
import { FaMoon } from 'react-icons/fa';
import { FaSun } from 'react-icons/fa';
import './Navbar.scss';

const Navbar = ({ onClick }) => {
  const [active, setActive] = useState(false);
  
  const clickHandler = () => {
    onClick();
    setActive(!active);
  }
  return (
    <nav className='navbar'>
      <FaBook className='book-icon' />
      <div className="style-togglers">
        <select name="font" id="font-select" defaultValue='serif'>
          <option value="serif">serif</option>
          <option value="sans-serif">sans-serif</option>
          <option value="monospace">monospace</option>
        </select>
        <div className="switch" onClick={clickHandler}><div className={active ? 'toggle-btn active' : 'toggle-btn'}></div></div>
        {!active? <FaSun/> : <FaMoon/>}
      </div>
    </nav>
  )
}

export default Navbar;

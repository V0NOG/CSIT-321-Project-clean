import { useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

interface FolderCardProps {
  title: string;
  fileCount: string;
  size: string;
  to?: string; // NEW: navigate when the card is clicked
}

const FolderCard: React.FC<FolderCardProps> = ({ title, fileCount, size, to }) => {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown(e?: React.MouseEvent) {
    e?.preventDefault(); // avoid navigating when clicking the menu
    setIsOpen((v) => !v);
  }
  function closeDropdown() {
    setIsOpen(false);
  }

  const CardInner = (
    <>
      <div className="flex justify-between mb-6">
        <div>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.3986 4.40674C12.9265 3.77722 12.1855 3.40674 11.3986 3.40674H2.5C1.11929 3.40674 0 4.52602 0 5.90674V30.0959C0 31.4766 1.11929 32.5959 2.5 32.5959H33.5C34.8807 32.5959 36 31.4766 36 30.0959V11.7446C36 10.3639 34.8807 9.24458 33.5 9.24458H18.277C17.4901 9.24458 16.7492 8.87409 16.277 8.24458L13.3986 4.40674Z"
              fill="url(#paint0_linear_2816_28044)"
            />
            <defs>
              <linearGradient id="paint0_linear_2816_28044" x1="18" y1="3.40674" x2="18" y2="32.5959" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFDC78" />
                <stop offset="1" stopColor="#FBBC1A" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <h4 className="mb-1 text-sm font-medium text-gray-800 dark:text-white/90">{title}</h4>
      <div className="flex items-center justify-between">
        <span className="block text-sm text-gray-500 dark:text-gray-400">{fileCount} Files</span>
        <span className="block text-sm text-right text-gray-500 dark:text-gray-400">{size}</span>
      </div>
    </>
  );

  // Wrap the card with a Link when `to` is provided
  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-2xl border border-gray-100 bg-gray-50 px-6 py-6 hover:bg-gray-100/70 transition-colors dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] xl:py-[27px]"
      >
        {CardInner}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03] xl:py-[27px]">
      {CardInner}
    </div>
  );
};

export default FolderCard;
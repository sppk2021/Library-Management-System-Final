import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit, Trash2, Search, Filter, BookOpen, AlertCircle, CheckCircle, MapPin, 
  Layers, Tag, Info, Bookmark, RefreshCw, X
} from 'lucide-react';
import { API } from '../lib/api';
import { Book, Category, BookStatus } from '../types';

interface BooksPageProps {
  user: any;
}

export default function BooksPage({ user }: BooksPageProps) {
  const isStaff = ['Admin', 'Librarian', 'Staff'].includes(user?.role);
  const isAdmin = user?.role === 'Admin';

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search/Filters
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<Partial<Book> | null>(null);
  const [selectedBookDetails, setSelectedBookDetails] = useState<Book | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedGenre, selectedCategory]);
  
  // Category management lists
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const bList = await API.getBooks();
      const cList = await API.getCategories();
      setBooks(bList);
      setCategories(cList);
    } catch (err: any) {
      setError(err?.message || 'Failed to download books inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook?.title || !activeBook?.isbn || !activeBook?.author || !activeBook?.quantity) {
      setError('Please populate all required fields.');
      return;
    }

    try {
      if (activeBook.book_id) {
        await API.updateBook(activeBook.book_id, activeBook);
        setSuccess('Book details updated successfully.');
      } else {
        await API.createBook({
          ...activeBook,
          cover_image: activeBook.cover_image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
          status: 'Available',
        });
        setSuccess('New book registered into system catalog.');
      }
      setIsBookModalOpen(false);
      setActiveBook(null);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to persist book details.');
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!confirm('Are you absolutely sure you want to delete this book record from system catalog?')) return;
    try {
      await API.deleteBook(bookId);
      setSuccess('Book record successfully purged.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete book.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await API.createCategory(newCatName, newCatDesc);
      setNewCatName('');
      setNewCatDesc('');
      setSuccess('New category added successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create category.');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm('Warning: Deleting this category will mark all books under it as "N/A". Proceed?')) return;
    try {
      await API.deleteCategory(catId);
      setSuccess('Category deleted successfully.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete category.');
    }
  };

  const handleReserve = async (bookId: number) => {
    try {
      await API.reserveBook(bookId);
      setSuccess('Book reservation created. Verify with librarian to collect.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reserve book.');
    }
  };

  const handleRequestBorrow = async (bookId: number) => {
    try {
      await API.requestBorrow(bookId);
      setSuccess('Borrow request submitted. Verify with librarian for approval.');
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to request borrow.');
    }
  };

  // Extract unique genres
  const genres = ['All', ...Array.from(new Set(books.map(b => b.genre).filter(Boolean)))];

  // Filtering Logic
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || 
                          b.author.toLowerCase().includes(search.toLowerCase()) ||
                          b.isbn.includes(search);
    const matchesGenre = selectedGenre === 'All' || b.genre === selectedGenre;
    const matchesCategory = selectedCategory === 'All' || b.category_id === Number(selectedCategory);
    return matchesSearch && matchesGenre && matchesCategory;
  });

  const BOOKS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Ribbon Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-xl">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="book-search"
              type="text"
              placeholder="Search by Title, Author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-2 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-805 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="All">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-2 bg-white/40 border border-white/50 rounded-lg text-xs text-slate-805 text-slate-800 focus:outline-none focus:bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="open-category-mgr-btn"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2 bg-white/30 hover:bg-white/70 border border-white/50 text-indigo-700 hover:text-indigo-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Layers className="w-4 h-4" />
              Manage Categories
            </button>
            <button
              id="open-add-book-btn"
              onClick={() => {
                setActiveBook({
                  title: '',
                  isbn: '',
                  publisher: '',
                  author: '',
                  genre: '',
                  category_id: categories[0]?.category_id || 0,
                  quantity: 1,
                  shelf_location: '',
                  cover_image: '',
                  status: 'Available',
                });
                setIsBookModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Book Record
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block border-2 border-indigo-600 border-t-transparent rounded-full w-8 h-8 animate-spin" />
        </div>
      ) : filteredBooks.length > 0 ? (
        <>
        {/* Books Listing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedBooks.map((book) => {
            const isAvailable = book.available_quantity > 0;
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={book.book_id}
                onClick={() => setSelectedBookDetails(book)}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between shadow-md group transition-all duration-250 cursor-pointer hover:shadow-lg hover:border-indigo-400"
              >
                {/* Book Cover Container */}
                <div className="aspect-[4/3] bg-indigo-50/25 relative overflow-hidden flex items-center justify-center border-b border-white/25">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <BookOpen className="w-8 h-8 text-indigo-400 mb-2" />
                      <span className="text-slate-500 text-[10px] font-mono">{book.isbn}</span>
                    </div>
                  )}

                  {/* Ribbon Badges Over Cover */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold bg-white/70 backdrop-blur-md text-slate-800 border border-white/50 rounded-md px-2 py-0.5 whitespace-nowrap">
                      {book.genre || 'General'}
                    </span>
                    {book.category_name && (
                      <span className="text-[9px] font-bold bg-indigo-100/70 backdrop-blur-md text-indigo-700 border border-white/50 rounded-md px-2 py-0.5 whitespace-nowrap">
                        {book.category_name}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shadow-sm ${
                      book.status === 'Available' && isAvailable ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      book.status === 'Reserved' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    }`}>
                      {book.status === 'Available' && isAvailable ? 'Available' : book.status}
                    </span>
                  </div>
                </div>

                {/* Info Metadata */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4 font-sans">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1 translate-y-0.5 group-hover:text-indigo-600 transition-colors uppercase tracking-tight font-display">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-505 text-slate-500 font-medium">by {book.author}</p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                      <Bookmark className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">ISBN: {book.isbn}</span>
                    </div>
                    {book.shelf_location && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>Shelf: {book.shelf_location}</span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Indicator & Action Buttons */}
                  <div className="space-y-3 pt-2 border-t border-white/30">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 font-sans">Available Stock:</span>
                      <span className="text-indigo-700 font-bold">
                        {book.available_quantity} / {book.quantity} copies
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {isStaff ? (
                        <>
                          <button
                            id={`edit-book-btn-${book.book_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveBook({ ...book });
                              setIsBookModalOpen(true);
                            }}
                            className="flex-1 py-1.5 bg-white/40 hover:bg-white/80 border border-white/50 text-slate-705 text-slate-700 hover:text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              id={`delete-book-btn-${book.book_id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBook(book.book_id);
                              }}
                              className="px-2.5 py-1.5 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 border border-rose-200/50 rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button
                            id={`borrow-book-btn-${book.book_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestBorrow(book.book_id);
                            }}
                            disabled={!isAvailable}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-transparent shadow-sm"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            {isAvailable ? 'Borrow' : 'N/A'}
                          </button>
                          <button
                            id={`reserve-book-btn-${book.book_id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReserve(book.book_id);
                            }}
                            disabled={!isAvailable}
                            className="flex-1 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 disabled:border-slate-200 disabled:text-slate-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            Reserve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-white/45 border border-white/60 rounded-xl mt-6 shadow-sm">
            <span className="text-slate-500 text-[10px] sm:text-xs">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredBooks.length} books total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                id="pagination-prev-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border border-indigo-600'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                id="pagination-next-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="text-center py-20 glass-card rounded-2xl">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No book records fit your search criteria.</p>
        </div>
      )}

      {/* CREATE & MODIFY BOOK DIALOG MODAL */}
      <AnimatePresence>
        {isBookModalOpen && activeBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4 block"
            >
              <button 
                id="close-book-modal-btn"
                onClick={() => { setIsBookModalOpen(false); setActiveBook(null); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-display">
                {activeBook.book_id ? 'Modify Catalog Entry' : 'Register New bibliography Code'}
              </h2>

              <form onSubmit={handleCreateOrUpdateBook} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Book Title *</label>
                    <input
                      id="book-form-title"
                      type="text"
                      required
                      value={activeBook.title || ''}
                      onChange={(e) => setActiveBook({...activeBook, title: e.target.value})}
                      placeholder="e.g. Introduction to Algorithms"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Author Name *</label>
                    <input
                      id="book-form-author"
                      type="text"
                      required
                      value={activeBook.author || ''}
                      onChange={(e) => setActiveBook({...activeBook, author: e.target.value})}
                      placeholder="Thomas Cormen"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">ISBN Code *</label>
                    <input
                      id="book-form-isbn"
                      type="text"
                      required
                      value={activeBook.isbn || ''}
                      onChange={(e) => setActiveBook({...activeBook, isbn: e.target.value})}
                      placeholder="978-0262033848"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-505"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Publisher Name</label>
                    <input
                      id="book-form-publisher"
                      type="text"
                      value={activeBook.publisher || ''}
                      onChange={(e) => setActiveBook({...activeBook, publisher: e.target.value})}
                      placeholder="e.g. MIT Press"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-505"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Publication Year</label>
                    <input
                      id="book-form-pubyear"
                      type="number"
                      value={activeBook.publication_year || ''}
                      onChange={(e) => setActiveBook({...activeBook, publication_year: Number(e.target.value) || undefined})}
                      placeholder="e.g. 2021"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-505"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Genre Class</label>
                    <input
                      id="book-form-genre"
                      type="text"
                      value={activeBook.genre || ''}
                      onChange={(e) => setActiveBook({...activeBook, genre: e.target.value})}
                      placeholder="Algorithms"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-505"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Genre Category</label>
                    <select
                      id="book-form-category"
                      value={activeBook.category_id || ''}
                      onChange={(e) => setActiveBook({...activeBook, category_id: Number(e.target.value)})}
                      className="w-full px-2 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-505"
                    >
                      <option value="0">Select Category</option>
                      {categories.map(c => (
                        <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Total Quantity *</label>
                    <input
                      id="book-form-qty"
                      type="number"
                      min={1}
                      required
                      value={activeBook.quantity || ''}
                      onChange={(e) => setActiveBook({...activeBook, quantity: Number(e.target.value)})}
                      placeholder="5"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Shelf Location Placement</label>
                    <input
                      id="book-form-shelf"
                      type="text"
                      value={activeBook.shelf_location || ''}
                      onChange={(e) => setActiveBook({...activeBook, shelf_location: e.target.value})}
                      placeholder="Shelf CS-03"
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Cover Image URL Address</label>
                    <input
                      id="book-form-cover"
                      type="text"
                      value={activeBook.cover_image || ''}
                      onChange={(e) => setActiveBook({...activeBook, cover_image: e.target.value})}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-white/60 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    id="cancel-book-form-btn"
                    type="button"
                    onClick={() => { setIsBookModalOpen(false); setActiveBook(null); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    id="save-book-form-btn"
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-sm shadow-indigo-150"
                  >
                    Commit Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANAGE CATEGORIES MODAL DIALOG */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4"
            >
              <button 
                id="close-category-mgr-btn"
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-display">
                <Tag className="w-4 h-4 text-indigo-650 text-indigo-600" />
                Manage System Categories
              </h2>

              {/* Category creation form */}
              <form onSubmit={handleCreateCategory} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs">
                <h3 className="font-bold text-slate-800">Create Category</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Name</label>
                    <input
                      id="cat-form-name"
                      type="text"
                      required
                      placeholder="e.g. Science Fiction"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/70 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Description</label>
                    <input
                      id="cat-form-desc"
                      type="text"
                      placeholder="Novels of space and futuristic science"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/70 border border-slate-200 rounded-md text-slate-800 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    id="submit-category-btn"
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-sm shadow-indigo-150"
                  >
                    Save Category
                  </button>
                </div>
              </form>

              {/* Category listing */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registered Categories</p>
                {categories.map((c) => (
                  <div key={c.category_id} className="flex items-center justify-between p-2.5 bg-white/40 border border-white/50 rounded-lg hover:bg-white/80 transition-colors shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">{c.category_name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.description || 'No description provided'}</p>
                    </div>
                    {isAdmin && (
                      <button
                        id={`delete-category-btn-${c.category_id}`}
                        onClick={() => handleDeleteCategory(c.category_id)}
                        className="p-1.5 bg-rose-50/55 hover:bg-rose-100/70 text-rose-600 border border-rose-200/50 rounded-md ml-3 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

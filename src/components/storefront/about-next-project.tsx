import Link from "next/link";

/**
 * Gradient call-to-action section before the footer. Ported from takekare's
 * AboutNextProject — invites the user to reach out about the next product.
 */
export function AboutNextProject() {
  return (
    <section className="py-20 brand-gradient text-white">
      <div className="container mx-auto px-4 text-center md:flex md:items-center md:justify-around">
        <div className="md:text-left">
          <h3 className="text-xl uppercase mb-2">Let&rsquo;s Talk</h3>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            about our <br />
            <span className="font-extrabold">next product</span>
          </h2>
        </div>
        <div className="flex flex-col items-center">
          <Link
            href="/contact"
            className="md:h-12 inline-block bg-white text-violet-600 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition duration-300"
          >
            Get In Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
